/**
 * companyService.ts
 *
 * Handles all company + company_members Appwrite logic for the HMEX Employer Dashboard.
 */

import { Client, Databases, Query, ID } from "appwrite";
import { updateUserProfile, getUserProfile } from "./userService";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const USERS_DB_ID                   = "hmex_db";
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
  $id:          string;
  $createdAt:   string;
  companyId:    string;
  companyName:  string;
  email:        string;
  userId:       string | null;
  status:       MemberStatus;
  inviteToken:  string;
  invitedAt:    string;
  acceptedAt:   string | null;
  invitedBy:    string;
  resendMsgId:  string | null;
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

// ─── CREATE COMPANY ───────────────────────────────────────────────────────────

/**
 * Called inside authService.signUp() for employer accounts.
 */
export async function createCompany(data: {
  name:    string;
  ownerId: string;
  size?:   string;
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
    return parseCompany(doc);
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

/**
 * Used on employer dashboard load to get the employer's company.
 */
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

// ─── INVITE EMPLOYEE (new / external) ────────────────────────────────────────

/**
 * Creates a pending company_members record and returns the inviteToken.
 * The API route calls this, then fires Resend.
 */
export async function inviteEmployee(data: {
  companyId:   string;
  companyName: string;
  email:       string;
  invitedBy:   string;
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

    // Increment inviteCount on the company
    const company = await getCompany(data.companyId);
    if (company) {
      await db.updateDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, data.companyId, {
        inviteCount: company.inviteCount + 1,
      });
    }

    console.log("[CompanyService] Invite created:", doc.$id, "token:", inviteToken);
    return { member: parseMember(doc), inviteToken };
  } catch (e) {
    console.error("[CompanyService] inviteEmployee error:", e);
    return null;
  }
}

// ─── ADD EXISTING EMPLOYEE ────────────────────────────────────────────────────

/**
 * Used when employer searches by email and the user already has an HMEX account.
 * Creates an active member record immediately and links the user's profile.
 */
export async function addExistingEmployee(data: {
  companyId:   string;
  companyName: string;
  userId:      string;
  email:       string;
  invitedBy:   string;
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

    // Link the user's profile to this company
    await updateUserProfile(data.userId, {
      companyId:   data.companyId,
      companyName: data.companyName,
    } as never);

    console.log("[CompanyService] Added existing employee:", data.userId);
    return parseMember(doc);
  } catch (e) {
    console.error("[CompanyService] addExistingEmployee error:", e);
    return null;
  }
}

// ─── CLAIM INVITE ─────────────────────────────────────────────────────────────

/**
 * Called post-signup when an employee registers via an invite link.
 * Validates the token, activates the member record, and links their profile.
 */
export async function claimInvite(
  inviteToken: string,
  userId:      string
): Promise<CompanyMember | null> {
  try {
    // Find the pending member record by token
    const res = await db.listDocuments(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, [
      Query.equal("inviteToken", inviteToken),
      Query.equal("status", "pending"),
      Query.limit(1),
    ]);

    if (res.documents.length === 0) {
      console.warn("[CompanyService] claimInvite: token not found or already used:", inviteToken);
      return null;
    }

    const member = parseMember(res.documents[0]);

    // Activate the member record
    const updated = await db.updateDocument(
      USERS_DB_ID,
      COMPANY_MEMBERS_COLLECTION_ID,
      member.$id,
      {
        userId:     userId,
        status:     "active",
        acceptedAt: new Date().toISOString(),
      }
    );

    // Link the user's profile to the company
    await updateUserProfile(userId, {
      companyId:   member.companyId,
      companyName: member.companyName,
    } as never);

    console.log("[CompanyService] Invite claimed by:", userId);
    return parseMember(updated);
  } catch (e) {
    console.error("[CompanyService] claimInvite error:", e);
    return null;
  }
}

// ─── GET COMPANY MEMBER BY TOKEN ──────────────────────────────────────────────

/**
 * Used on the register page to validate an invite token and show the company name.
 */
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

/**
 * Returns all non-removed members with user profile data merged in.
 */
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

    // Merge in user profile data for active members
    const rows: EmployeeDashboardRow[] = await Promise.all(
      members.map(async (m) => {
        if (m.userId) {
          const profile = await getUserProfile(m.userId).catch(() => null);
          return {
            ...m,
            fullName:         profile?.fullName || null,
            avatar:           profile?.avatar || null,
            riskScore:        null, // extend when risk fields added to UserProfile
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

/**
 * Sets member status to "removed" and clears companyId from user profile.
 */
export async function removeEmployee(
  memberId: string,
  userId:   string | null
): Promise<boolean> {
  try {
    await db.updateDocument(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, memberId, {
      status: "removed",
    });

    if (userId) {
      await updateUserProfile(userId, {
        companyId:   "",
        companyName: "",
      } as never);
    }

    console.log("[CompanyService] Removed employee, memberId:", memberId);
    return true;
  } catch (e) {
    console.error("[CompanyService] removeEmployee error:", e);
    return false;
  }
}