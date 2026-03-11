// app/api/invite-employee/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { Client, Databases, ID, Query } from "node-appwrite";

const resend  = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hmex.vercel.app";

const USERS_DB_ID                   = "hmex_db";
const USERS_COLLECTION_ID           = "users";
const COMPANY_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_MEMBERS_COLLECTION_ID!;
const COMPANIES_COLLECTION_ID       = process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID!;
const EMPLOYER_NOTIF_COLLECTION_ID  = "employer_notifications";

const serverClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!.replace(/\/$/, ""))
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const serverDb = new Databases(serverClient);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Create an employer notification (employer_notifications collection) */
async function createEmployerNotification(data: {
  companyId:    string;
  employerId:   string;
  type:         string;
  title:        string;
  message:      string;
  priority:     string;
  category:     string;
  actionUrl?:   string;
  actionLabel?: string;
  metadata?:    Record<string, unknown>;
  expiresAt?:   string;
}) {
  try {
    const doc = await serverDb.createDocument(
      USERS_DB_ID,
      EMPLOYER_NOTIF_COLLECTION_ID,
      ID.unique(),
      {
        companyId:    data.companyId,
        employerId:   data.employerId,
        type:         data.type,
        title:        data.title,
        message:      data.message,
        isRead:       false,
        priority:     data.priority,
        category:     data.category,
        actionUrl:    data.actionUrl   ?? null,
        actionLabel:  data.actionLabel ?? null,
        metadata:     data.metadata ? JSON.stringify(data.metadata) : null,
        expiresAt:    data.expiresAt   ?? null,
      }
    );
    console.log("[invite-employee] employer notification created:", doc.$id, "type:", data.type);
  } catch (e) {
    console.error("[invite-employee] createEmployerNotification failed:", e);
  }
}

/** Create an employee notification (notifications collection) */
async function createEmployeeNotification(data: {
  userId:       string;
  type:         string;
  title:        string;
  message:      string;
  priority:     string;
  category:     string;
  actionUrl?:   string;
  actionLabel?: string;
  metadata?:    Record<string, unknown>;
  expiresAt?:   string;
}) {
  try {
    const doc = await serverDb.createDocument(
      USERS_DB_ID,
      "notifications",
      ID.unique(),
      {
        userId:      data.userId,
        type:        data.type,
        title:       data.title,
        message:     data.message,
        isRead:      false,
        priority:    data.priority,
        category:    data.category,
        actionUrl:   data.actionUrl   ?? null,
        actionLabel: data.actionLabel ?? null,
        metadata:    data.metadata ? JSON.stringify(data.metadata) : null,
        expiresAt:   data.expiresAt   ?? null,
      }
    );
    console.log("[invite-employee] employee notification created:", doc.$id, "for user:", data.userId, "type:", data.type);
  } catch (e) {
    console.error("[invite-employee] createEmployeeNotification failed:", e);
  }
}

// ─── POST — send invite ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[invite-employee] body:", body);

    const { employeeEmail, companyName, companyId, employerName, invitedBy } = body;

    if (!employeeEmail || !companyName || !companyId || !invitedBy) {
      return NextResponse.json(
        { error: "employeeEmail, companyName, companyId, and invitedBy are required." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeEmail)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const email = employeeEmail.toLowerCase().trim();

    // ── Already a member? ────────────────────────────────────────────────────
    const existingMember = await serverDb.listDocuments(
      USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID,
      [
        Query.equal("companyId", companyId),
        Query.equal("email", email),
        Query.notEqual("status", "removed"),
        Query.limit(1),
      ]
    ).catch(() => null);

    if (existingMember && existingMember.documents.length > 0) {
      const m = existingMember.documents[0];
      return NextResponse.json(
        { error: `${email} is already ${m.status === "active" ? "a member of" : "invited to"} this company.` },
        { status: 409 }
      );
    }

    // ── Existing HMEX account? ───────────────────────────────────────────────
    const existingUser = await serverDb.listDocuments(
      USERS_DB_ID, USERS_COLLECTION_ID,
      [Query.equal("email", email), Query.limit(1)]
    ).catch(() => null);

    const existingProfile = existingUser?.documents?.[0] ?? null;
    const isExistingUser  = !!existingProfile;
    const existingUserId  = existingProfile?.$id ?? null;

    // ── Create member record ─────────────────────────────────────────────────
    const inviteToken = crypto.randomUUID();
    const now         = new Date().toISOString();
    const status      = isExistingUser ? "active"  : "pending";
    const acceptedAt  = isExistingUser ? now        : null;
    const docId       = crypto.randomUUID().replace(/-/g, "").slice(0, 20);

    const memberDoc = await serverDb.createDocument(
      USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, docId,
      {
        companyId, companyName, email,
        userId:      existingUserId,
        status,
        inviteToken,
        invitedAt:   now,
        acceptedAt,
        invitedBy,
        resendMsgId: null,
      }
    );

    // ── Link existing user's profile ─────────────────────────────────────────
    if (isExistingUser && existingUserId) {
      await serverDb.updateDocument(
        USERS_DB_ID, USERS_COLLECTION_ID, existingUserId,
        { companyId, companyName }
      ).catch((e) => console.error("[invite-employee] profile link failed:", e));
    }

    // ── Increment inviteCount ────────────────────────────────────────────────
    let totalInvited = 1;
    await serverDb.getDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, companyId)
      .then((co) => {
        totalInvited = ((co.inviteCount as number) || 0) + 1;
        return serverDb.updateDocument(
          USERS_DB_ID, COMPANIES_COLLECTION_ID, companyId,
          { inviteCount: totalInvited }
        );
      })
      .catch(() => {});

    // ── Count active members for notification copy ───────────────────────────
    let totalActive = 1;
    if (isExistingUser) {
      const activeRes = await serverDb.listDocuments(
        USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID,
        [
          Query.equal("companyId", companyId),
          Query.equal("status", "active"),
          Query.limit(100),
        ]
      ).catch(() => null);
      totalActive = activeRes ? activeRes.documents.length : 1;
    }

    const employeeName = (existingProfile?.fullName as string) || email;

    // ── Fire EMPLOYER notification ───────────────────────────────────────────
    if (isExistingUser) {
      await createEmployerNotification({
        companyId,
        employerId:  invitedBy,
        type:        "employee_joined",
        title:       "New Employee Added",
        message:     `${employeeName} already had an HMEX account and has been added to your workforce. You now have ${totalActive} active employee${totalActive !== 1 ? "s" : ""}.`,
        priority:    "medium",
        category:    "employee_activity",
        actionUrl:   "/dashboard/employer/employees",
        actionLabel: "View Team",
        metadata:    { employeeName, totalActive },
      });
    } else {
      await createEmployerNotification({
        companyId,
        employerId:  invitedBy,
        type:        "invite_sent",
        title:       "Invitation Sent",
        message:     `An invitation has been sent to ${email}. You have sent ${totalInvited} invitation${totalInvited !== 1 ? "s" : ""} in total.`,
        priority:    "low",
        category:    "employee_activity",
        actionUrl:   "/dashboard/employer/employees",
        actionLabel: "Manage Team",
        metadata:    { invitedEmail: email, totalInvited },
        expiresAt:   new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // ── Fire EMPLOYEE notification (only if they already have an account) ────
    // Pending invites: they don't have an account yet, nothing to notify.
    // Once they sign up, the PATCH /claim flow will fire the notification then.
    if (isExistingUser && existingUserId) {
      await createEmployeeNotification({
        userId:      existingUserId,
        type:        "team_added",
        title:       `You've been added to ${companyName}`,
        message:     `${employerName || companyName} has added you to their workforce on HMEX. You can view your team and any wellness programs they share from My Teams.`,
        priority:    "medium",
        category:    "team",
        actionUrl:   "/dashboard/teams",
        actionLabel: "View My Teams",
        metadata:    { companyName, companyId },
      });
    }

    // ── Build invite URL ─────────────────────────────────────────────────────
    const inviteUrl = `${APP_URL}/register?invite=${inviteToken}&company=${companyId}`;

    // ── Send email ───────────────────────────────────────────────────────────
    let resendMsgId: string | null = null;
    let emailError:  string | null = null;

    try {
      if (isExistingUser) {
        const emailRes = await resend.emails.send({
          from:    "Health Master <no-reply@healthmasterco.com>",
          to:      email,
          subject: `You've been added to ${companyName} on HMEX`,
          html:    buildExistingUserEmail({ companyName, employerName, appUrl: APP_URL }),
        });
        resendMsgId = emailRes.data?.id ?? null;
        if (emailRes.error) throw new Error(emailRes.error.message);
      } else {
        const emailRes = await resend.emails.send({
          from:    "Health Master <no-reply@healthmasterco.com>",
          to:      email,
          subject: `${employerName || companyName} invited you to join ${companyName} on HMEX`,
          html:    buildInviteEmail({ companyName, employerName, inviteUrl }),
        });
        resendMsgId = emailRes.data?.id ?? null;
        if (emailRes.error) throw new Error(emailRes.error.message);
      }
    } catch (e: unknown) {
      emailError = e instanceof Error ? e.message : "Email delivery failed";
      console.error("[invite-employee] Resend error:", emailError);
    }

    // ── Store resendMsgId ────────────────────────────────────────────────────
    if (resendMsgId) {
      serverDb.updateDocument(
        USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, memberDoc.$id,
        { resendMsgId }
      ).catch(() => {});
    }

    return NextResponse.json({
      success:       true,
      memberId:      memberDoc.$id,
      status,
      isExistingUser,
      inviteUrl:     isExistingUser ? null : inviteUrl,
      emailSent:     !!resendMsgId,
      emailError,
    });

  } catch (err: unknown) {
    console.error("[invite-employee API] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to send invitation. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── PATCH — claim invite ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const { inviteToken, userId } = await req.json();
    if (!inviteToken || !userId) {
      return NextResponse.json(
        { error: "inviteToken and userId are required." },
        { status: 400 }
      );
    }

    console.log("[invite-employee PATCH] claiming token:", inviteToken, "for user:", userId);

    // Find the member record by token (retry once)
    let memberDoc: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
      const res = await serverDb.listDocuments(
        USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID,
        [Query.equal("inviteToken", inviteToken), Query.limit(1)]
      ).catch(() => null);
      if (res && res.documents.length > 0) {
        memberDoc = res.documents[0] as Record<string, unknown>;
        break;
      }
    }

    if (!memberDoc) {
      console.warn("[invite-employee PATCH] member not found for token:", inviteToken);
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }

    const companyId   = memberDoc.companyId   as string;
    const companyName = memberDoc.companyName as string;
    const memberId    = memberDoc.$id         as string;
    const now         = new Date().toISOString();

    // Idempotent: already active
    if (memberDoc.status === "active") {
      console.log("[invite-employee PATCH] already active, re-linking profile for:", userId);
      await serverDb.updateDocument(
        USERS_DB_ID, USERS_COLLECTION_ID, userId,
        { companyId, companyName }
      ).catch((e) => console.error("[claim] profile re-link failed:", e));

      if (!memberDoc.userId) {
        await serverDb.updateDocument(
          USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, memberId,
          { userId }
        ).catch(() => {});
      }
      return NextResponse.json({ success: true, companyId, companyName, alreadyActive: true });
    }

    // Activate member record
    await serverDb.updateDocument(
      USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, memberId,
      { userId, status: "active", acceptedAt: now }
    );
    console.log("[invite-employee PATCH] activated member:", memberId);

    // Link user profile
    await serverDb.updateDocument(
      USERS_DB_ID, USERS_COLLECTION_ID, userId,
      { companyId, companyName }
    ).catch((e) => console.error("[claim] profile link failed:", e));

    // Fetch company + user details for notification copy
    const company = await serverDb.getDocument(
      USERS_DB_ID, COMPANIES_COLLECTION_ID, companyId
    ).catch(() => null);

    const userDoc = await serverDb.getDocument(
      USERS_DB_ID, USERS_COLLECTION_ID, userId
    ).catch(() => null);

    const employeeName = (userDoc?.fullName as string) || (memberDoc.email as string);

    // Count active members
    const activeRes = await serverDb.listDocuments(
      USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID,
      [
        Query.equal("companyId", companyId),
        Query.equal("status", "active"),
        Query.limit(100),
      ]
    ).catch(() => null);
    const totalActive = activeRes ? activeRes.documents.length : 1;

    // ── Notify EMPLOYER invite was accepted ──────────────────────────────────
    if (company) {
      await createEmployerNotification({
        companyId,
        employerId:  company.ownerId as string,
        type:        "employee_joined",
        title:       "Employee Accepted Invitation",
        message:     `${employeeName} accepted their invitation and joined your workforce. You now have ${totalActive} active employee${totalActive !== 1 ? "s" : ""}.`,
        priority:    "medium",
        category:    "employee_activity",
        actionUrl:   "/dashboard/employer/employees",
        actionLabel: "View Team",
        metadata:    { employeeName, totalActive },
      });
    }

    // ── Notify EMPLOYEE they are now part of the team ────────────────────────
    await createEmployeeNotification({
      userId,
      type:        "team_added",
      title:       `You've joined ${companyName}`,
      message:     `Your invitation to ${companyName} has been accepted. You're now part of their workforce on HMEX. View your team and any wellness programs from My Teams.`,
      priority:    "medium",
      category:    "team",
      actionUrl:   "/dashboard/teams",
      actionLabel: "View My Teams",
      metadata:    { companyName, companyId },
    });

    return NextResponse.json({ success: true, companyId, companyName });

  } catch (err: unknown) {
    console.error("[invite-employee PATCH] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to claim invite.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function buildInviteEmail({
  companyName, employerName, inviteUrl,
}: { companyName: string; employerName?: string; inviteUrl: string }): string {
  const sender = employerName ? `<strong>${employerName}</strong> from ` : "";
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;">
      <div style="background:linear-gradient(135deg,#0d9488,#059669);border-radius:8px;padding:32px 24px;margin-bottom:24px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">You've been invited to join ${companyName}</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">${employerName || companyName} invited you to HMEX</p>
      </div>
      <div style="background:white;border-radius:8px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;">
        <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 16px;">Hi! ${sender}<strong>${companyName}</strong> has invited you to join their team on HMEX — a free platform for health assessments and personalised wellness insights.</p>
        <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 24px;">Your health data is <strong>completely private</strong>. Your employer only ever sees anonymised team-level insights — never your individual results.</p>
        <div style="text-align:center;">
          <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Accept Invitation &amp; Create Account</a>
        </div>
      </div>
      <div style="background:white;border-radius:8px;padding:16px 24px;border:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;">If the button doesn't work:<br/><a href="${inviteUrl}" style="color:#0d9488;word-break:break-all;">${inviteUrl}</a></p>
      </div>
      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;">If you weren't expecting this, you can safely ignore it.<br/>Health Master · info@healthmasterco.com</p>
    </div>`;
}

function buildExistingUserEmail({
  companyName, employerName, appUrl,
}: { companyName: string; employerName?: string; appUrl: string }): string {
  const sender = employerName ? `<strong>${employerName}</strong> from ` : "";
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;">
      <div style="background:linear-gradient(135deg,#0d9488,#059669);border-radius:8px;padding:32px 24px;margin-bottom:24px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:22px;font-weight:700;">You've been added to ${companyName}</h1>
        <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">Your HMEX account is now linked to ${companyName}</p>
      </div>
      <div style="background:white;border-radius:8px;padding:24px;margin-bottom:16px;border:1px solid #e2e8f0;">
        <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 16px;">Hi! ${sender}<strong>${companyName}</strong> has added you to their health programme on HMEX. Since you already have an account, you're good to go — no action needed.</p>
        <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 24px;">Your health data remains <strong>completely private</strong>. Your employer only sees anonymised team insights.</p>
        <div style="text-align:center;">
          <a href="${appUrl}/dashboard/teams" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">View My Teams</a>
        </div>
      </div>
      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;">Health Master · info@healthmasterco.com</p>
    </div>`;
}