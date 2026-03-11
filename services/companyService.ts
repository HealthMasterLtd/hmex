/**
 * companyService.ts
 */

import { Client, Databases, Query, ID } from "appwrite";
import { updateUserProfile, getUserProfile } from "./userService";
import {
  notifyInviteSent,
  notifyEmployeeJoined,
  notifyEmployeeRemoved,
  notifyEmployerWelcome,
} from "./employerNotificationsService";
import {
  notifyEmployeeAddedToTeam,
  notifyEmployeeRemovedFromTeam,
} from "./NotificationsService"; // ← employee-side notifications

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const USERS_DB_ID                   = "hmex_db";
export const USERS_COLLECTION_ID           = "users";
export const COMPANIES_COLLECTION_ID       = process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID!;
export const COMPANY_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_MEMBERS_COLLECTION_ID!;

const client = new Client()
  .setEndpoint(ENDPOINT.replace(/\/$/, ""))
  .setProject(PROJECT_ID);

const db = new Databases(client);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface Company {
  $id:         string;
  $createdAt:  string;
  name:        string;
  ownerId:     string;
  size:        string;
  industry:    string;
  inviteCount: number;
}

export type MemberStatus = "pending" | "active" | "declined" | "removed";

export interface CompanyMember {
  $id:         string;
  $createdAt:  string;
  companyId:   string;
  companyName: string;
  email:       string;
  userId:      string | null;
  status:      MemberStatus;
  inviteToken: string;
  invitedAt:   string;
  acceptedAt:  string | null;
  invitedBy:   string;
  resendMsgId: string | null;
}

export interface EmployeeDashboardRow extends CompanyMember {
  fullName:         string | null;
  avatar:           string | null;
  riskScore:        string | null;
  diabetesRisk:     string | null;
  hypertensionRisk: string | null;
  lastAssessment:   string | null;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseCompany(doc: Record<string, unknown>): Company {
  return {
    $id:         doc.$id as string,
    $createdAt:  doc.$createdAt as string,
    name:        (doc.name as string) || "",
    ownerId:     (doc.ownerId as string) || "",
    size:        (doc.size as string) || "",
    industry:    (doc.industry as string) || "",
    inviteCount: (doc.inviteCount as number) || 0,
  };
}

function parseMember(doc: Record<string, unknown>): CompanyMember {
  return {
    $id:         doc.$id as string,
    $createdAt:  doc.$createdAt as string,
    companyId:   (doc.companyId as string) || "",
    companyName: (doc.companyName as string) || "",
    email:       (doc.email as string) || "",
    userId:      (doc.userId as string) || null,
    status:      ((doc.status as MemberStatus) || "pending"),
    inviteToken: (doc.inviteToken as string) || "",
    invitedAt:   (doc.invitedAt as string) || "",
    acceptedAt:  (doc.acceptedAt as string) || null,
    invitedBy:   (doc.invitedBy as string) || "",
    resendMsgId: (doc.resendMsgId as string) || null,
  };
}

// ─── RECONCILE PENDING MEMBERS ────────────────────────────────────────────────
// Runs automatically inside getCompanyMembers on every refresh.
// For each pending member, checks if their email now has an HMEX account.
// If yes → activates the member, links their profile, fires notifications to
// BOTH the employer and the employee.

async function reconcilePendingMembers(pendingMembers: CompanyMember[]): Promise<void> {
  if (pendingMembers.length === 0) return;

  await Promise.all(
    pendingMembers.map(async (m) => {
      try {
        const userRes = await db.listDocuments(USERS_DB_ID, USERS_COLLECTION_ID, [
          Query.equal("email", m.email),
          Query.limit(1),
        ]);

        if (userRes.documents.length === 0) return; // still hasn't signed up

        const userDoc = userRes.documents[0];
        const now     = new Date().toISOString();

        console.log("[CompanyService] reconcile: activating", m.email, "→ member", m.$id);

        // Activate member record
        await db.updateDocument(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, m.$id, {
          userId:     userDoc.$id,
          status:     "active",
          acceptedAt: now,
        });

        // Link user profile to company
        await updateUserProfile(userDoc.$id, {
          companyId:   m.companyId,
          companyName: m.companyName,
        } as never).catch((e) =>
          console.error("[CompanyService] reconcile profile link failed:", e)
        );

        // ── Notify EMPLOYEE they've been added to the team ─────────────
        notifyEmployeeAddedToTeam(
          userDoc.$id as string,
          m.companyName,
          m.companyId,
        ).catch((e) =>
          console.error("[CompanyService] reconcile notifyEmployeeAddedToTeam error:", e)
        );

        // ── Notify EMPLOYER an employee has joined ─────────────────────
        const company = await getCompany(m.companyId).catch(() => null);
        if (company) {
          const allMembers = await db.listDocuments(
            USERS_DB_ID,
            COMPANY_MEMBERS_COLLECTION_ID,
            [
              Query.equal("companyId", m.companyId),
              Query.equal("status", "active"),
              Query.limit(100),
            ]
          ).catch(() => null);

          const totalActive = allMembers ? allMembers.documents.length : 0;
          const employeeName =
            (userDoc.fullName as string) ||
            (userDoc.name as string) ||
            m.email;

          notifyEmployeeJoined(
            m.companyId,
            company.ownerId,
            employeeName,
            totalActive
          ).catch((e) =>
            console.error("[CompanyService] reconcile notifyEmployeeJoined error:", e)
          );
        }
      } catch (e) {
        console.error("[CompanyService] reconcile error for", m.email, ":", e);
      }
    })
  );
}

// ─── CREATE COMPANY ───────────────────────────────────────────────────────────

export async function createCompany(data: {
  name:      string;
  ownerId:   string;
  size?:     string;
  industry?: string;
}): Promise<Company | null> {
  try {
    const doc = await db.createDocument(
      USERS_DB_ID,
      COMPANIES_COLLECTION_ID,
      ID.unique(),
      {
        name:        data.name,
        ownerId:     data.ownerId,
        size:        data.size || "",
        industry:    data.industry || "",
        inviteCount: 0,
      }
    );
    console.log("[CompanyService] Created company:", doc.$id);
    const company = parseCompany(doc);

    // ── Welcome notification to employer ──────────────────────────────
    notifyEmployerWelcome(company.$id, company.ownerId, company.name).catch((e) =>
      console.error("[CompanyService] createCompany notifyWelcome error:", e)
    );

    return company;
  } catch (e) {
    console.error("[CompanyService] createCompany error:", e);
    return null;
  }
}

// ─── GET COMPANY ──────────────────────────────────────────────────────────────

export async function getCompany(companyId: string): Promise<Company | null> {
  try {
    const doc = await db.getDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, companyId);
    return parseCompany(doc);
  } catch (e) {
    console.error("[CompanyService] getCompany error:", e);
    return null;
  }
}

// ─── GET COMPANY BY OWNER ─────────────────────────────────────────────────────

export async function getCompanyByOwner(userId: string): Promise<Company | null> {
  try {
    const res = await db.listDocuments(USERS_DB_ID, COMPANIES_COLLECTION_ID, [
      Query.equal("ownerId", userId),
      Query.limit(1),
    ]);
    if (res.documents.length === 0) return null;
    return parseCompany(res.documents[0]);
  } catch (e) {
    console.error("[CompanyService] getCompanyByOwner error:", e);
    return null;
  }
}

// ─── INVITE EMPLOYEE ──────────────────────────────────────────────────────────

export async function inviteEmployee(data: {
  companyId:   string;
  companyName: string;
  email:       string;
  invitedBy:   string; // employer's userId
}): Promise<{ member: CompanyMember; inviteToken: string } | null> {
  try {
    const inviteToken = crypto.randomUUID();
    const doc = await db.createDocument(
      USERS_DB_ID,
      COMPANY_MEMBERS_COLLECTION_ID,
      ID.unique(),
      {
        companyId:   data.companyId,
        companyName: data.companyName,
        email:       data.email.toLowerCase().trim(),
        userId:      null,
        status:      "pending",
        inviteToken,
        invitedAt:   new Date().toISOString(),
        acceptedAt:  null,
        invitedBy:   data.invitedBy,
        resendMsgId: null,
      }
    );

    const company = await getCompany(data.companyId);
    if (company) {
      await db.updateDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, data.companyId, {
        inviteCount: company.inviteCount + 1,
      });

      // ── Notify employer invite was sent ────────────────────────────
      notifyInviteSent(
        data.companyId,
        data.invitedBy,
        data.email,
        company.inviteCount + 1
      ).catch((e) =>
        console.error("[CompanyService] inviteEmployee notifyInviteSent error:", e)
      );
    }

    return { member: parseMember(doc), inviteToken };
  } catch (e) {
    console.error("[CompanyService] inviteEmployee error:", e);
    return null;
  }
}

// ─── ADD EXISTING EMPLOYEE ────────────────────────────────────────────────────

export async function addExistingEmployee(data: {
  companyId:   string;
  companyName: string;
  userId:      string;
  email:       string;
  invitedBy:   string; // employer's userId
}): Promise<CompanyMember | null> {
  try {
    const inviteToken = crypto.randomUUID();
    const doc = await db.createDocument(
      USERS_DB_ID,
      COMPANY_MEMBERS_COLLECTION_ID,
      ID.unique(),
      {
        companyId:   data.companyId,
        companyName: data.companyName,
        email:       data.email.toLowerCase().trim(),
        userId:      data.userId,
        status:      "active",
        inviteToken,
        invitedAt:   new Date().toISOString(),
        acceptedAt:  new Date().toISOString(),
        invitedBy:   data.invitedBy,
        resendMsgId: null,
      }
    );

    await updateUserProfile(data.userId, {
      companyId:   data.companyId,
      companyName: data.companyName,
    } as never);

    // ── Notify EMPLOYEE they've been added ─────────────────────────
    notifyEmployeeAddedToTeam(
      data.userId,
      data.companyName,
      data.companyId,
    ).catch((e) =>
      console.error("[CompanyService] addExistingEmployee notifyEmployeeAddedToTeam error:", e)
    );

    // ── Notify EMPLOYER ────────────────────────────────────────────
    const allMembers = await db.listDocuments(
      USERS_DB_ID,
      COMPANY_MEMBERS_COLLECTION_ID,
      [
        Query.equal("companyId", data.companyId),
        Query.equal("status", "active"),
        Query.limit(100),
      ]
    ).catch(() => null);

    const totalActive    = allMembers ? allMembers.documents.length : 1;
    const employeeProfile = await getUserProfile(data.userId).catch(() => null);
    const employeeName   = employeeProfile?.fullName || data.email;

    notifyEmployeeJoined(
      data.companyId,
      data.invitedBy,
      employeeName,
      totalActive
    ).catch((e) =>
      console.error("[CompanyService] addExistingEmployee notifyEmployeeJoined error:", e)
    );

    return parseMember(doc);
  } catch (e) {
    console.error("[CompanyService] addExistingEmployee error:", e);
    return null;
  }
}

// ─── CLAIM INVITE (client-side — prefer server PATCH route) ──────────────────

export async function claimInvite(
  inviteToken: string,
  userId:      string
): Promise<CompanyMember | null> {
  try {
    const res = await db.listDocuments(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, [
      Query.equal("inviteToken", inviteToken),
      Query.equal("status", "pending"),
      Query.limit(1),
    ]);

    if (res.documents.length === 0) return null;

    const member  = parseMember(res.documents[0]);
    const updated = await db.updateDocument(
      USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, member.$id,
      { userId, status: "active", acceptedAt: new Date().toISOString() }
    );

    await updateUserProfile(userId, {
      companyId:   member.companyId,
      companyName: member.companyName,
    } as never);

    // ── Notify EMPLOYEE their invite was claimed / they joined ─────
    notifyEmployeeAddedToTeam(
      userId,
      member.companyName,
      member.companyId,
    ).catch((e) =>
      console.error("[CompanyService] claimInvite notifyEmployeeAddedToTeam error:", e)
    );

    // ── Notify EMPLOYER ────────────────────────────────────────────
    const company = await getCompany(member.companyId).catch(() => null);
    if (company) {
      const allMembers = await db.listDocuments(
        USERS_DB_ID,
        COMPANY_MEMBERS_COLLECTION_ID,
        [
          Query.equal("companyId", member.companyId),
          Query.equal("status", "active"),
          Query.limit(100),
        ]
      ).catch(() => null);

      const totalActive  = allMembers ? allMembers.documents.length : 1;
      const userProfile  = await getUserProfile(userId).catch(() => null);
      const employeeName = userProfile?.fullName || member.email;

      notifyEmployeeJoined(
        member.companyId,
        company.ownerId,
        employeeName,
        totalActive
      ).catch((e) =>
        console.error("[CompanyService] claimInvite notifyEmployeeJoined error:", e)
      );
    }

    return parseMember(updated);
  } catch (e) {
    console.error("[CompanyService] claimInvite error:", e);
    return null;
  }
}

// ─── GET COMPANY MEMBER BY TOKEN ──────────────────────────────────────────────

export async function getCompanyMemberByToken(
  inviteToken: string
): Promise<CompanyMember | null> {
  try {
    const res = await db.listDocuments(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, [
      Query.equal("inviteToken", inviteToken),
      Query.limit(1),
    ]);
    if (res.documents.length === 0) return null;
    return parseMember(res.documents[0]);
  } catch (e) {
    console.error("[CompanyService] getCompanyMemberByToken error:", e);
    return null;
  }
}

// ─── GET COMPANY MEMBERS ──────────────────────────────────────────────────────

export async function getCompanyMembers(
  companyId: string
): Promise<EmployeeDashboardRow[]> {
  try {
    const res = await db.listDocuments(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, [
      Query.equal("companyId", companyId),
      Query.notEqual("status", "removed"),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);

    const members = res.documents.map((d) => parseMember(d));

    // ── Auto-reconcile pending members ──────────────────────────────
    const pending = members.filter((m) => m.status === "pending");
    if (pending.length > 0) {
      reconcilePendingMembers(pending).catch(console.error);
    }

    // ── Merge in user profile data ───────────────────────────────────
    const rows: EmployeeDashboardRow[] = await Promise.all(
      members.map(async (m) => {
        if (m.userId) {
          const profile = await getUserProfile(m.userId).catch(() => null);
          return {
            ...m,
            fullName:         profile?.fullName || null,
            avatar:           profile?.avatar   || null,
            riskScore:        null,
            diabetesRisk:     null,
            hypertensionRisk: null,
            lastAssessment:   null,
          };
        }
        return {
          ...m,
          fullName:         null,
          avatar:           null,
          riskScore:        null,
          diabetesRisk:     null,
          hypertensionRisk: null,
          lastAssessment:   null,
        };
      })
    );

    return rows;
  } catch (e) {
    console.error("[CompanyService] getCompanyMembers error:", e);
    return [];
  }
}

// ─── REMOVE EMPLOYEE ──────────────────────────────────────────────────────────

export async function removeEmployee(
  memberId:   string,
  userId:     string | null,
  employerId: string,
  companyId:  string
): Promise<boolean> {
  try {
    // Grab member details before marking removed
    let employeeName = "An employee";
    let companyName  = "";
    if (userId) {
      const profile = await getUserProfile(userId).catch(() => null);
      employeeName  = profile?.fullName || profile?.email || employeeName;
      companyName   = profile?.companyName || "";
    }

    await db.updateDocument(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, memberId, {
      status: "removed",
    });

    if (userId) {
      await updateUserProfile(userId, {
        companyId:   "",
        companyName: "",
      } as never);

      // ── Notify EMPLOYEE they were removed ──────────────────────────
      notifyEmployeeRemovedFromTeam(
        userId,
        companyName,
        companyId,
      ).catch((e) =>
        console.error("[CompanyService] removeEmployee notifyEmployeeRemovedFromTeam error:", e)
      );
    }

    // ── Notify EMPLOYER ────────────────────────────────────────────
    const allMembers = await db.listDocuments(
      USERS_DB_ID,
      COMPANY_MEMBERS_COLLECTION_ID,
      [
        Query.equal("companyId", companyId),
        Query.equal("status", "active"),
        Query.limit(100),
      ]
    ).catch(() => null);

    const totalActive = allMembers ? allMembers.documents.length : 0;

    notifyEmployeeRemoved(
      companyId,
      employerId,
      employeeName,
      totalActive
    ).catch((e) =>
      console.error("[CompanyService] removeEmployee notifyEmployeeRemoved error:", e)
    );

    return true;
  } catch (e) {
    console.error("[CompanyService] removeEmployee error:", e);
    return false;
  }
}