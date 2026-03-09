// app/api/invite-employee/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { Client, Databases, Query } from "node-appwrite";

const resend  = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hmex.vercel.app";

const USERS_DB_ID                   = "hmex_db";
const USERS_COLLECTION_ID           = "users";
const COMPANY_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_MEMBERS_COLLECTION_ID!;
const COMPANIES_COLLECTION_ID       = process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID!;

const serverClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!.replace(/\/$/, ""))
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const serverDb = new Databases(serverClient);

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
      [Query.equal("companyId", companyId), Query.equal("email", email), Query.notEqual("status", "removed"), Query.limit(1)]
    ).catch(() => null);

    if (existingMember && existingMember.documents.length > 0) {
      const m = existingMember.documents[0];
      return NextResponse.json(
        { error: `${email} is already ${m.status === "active" ? "a member of" : "invited to"} this company.` },
        { status: 409 }
      );
    }

    // ── Existing HMEX account? ────────────────────────────────────────────────
    const existingUser = await serverDb.listDocuments(
      USERS_DB_ID, USERS_COLLECTION_ID,
      [Query.equal("email", email), Query.limit(1)]
    ).catch(() => null);

    const existingProfile = existingUser?.documents?.[0] ?? null;
    const isExistingUser  = !!existingProfile;
    const existingUserId  = existingProfile?.$id ?? null;

    // ── Create member record ──────────────────────────────────────────────────
    const inviteToken = crypto.randomUUID();
    const now         = new Date().toISOString();
    const status      = isExistingUser ? "active"  : "pending";
    const acceptedAt  = isExistingUser ? now        : null;
    const docId       = crypto.randomUUID().replace(/-/g, "").slice(0, 20);

    const memberDoc = await serverDb.createDocument(
      USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, docId,
      { companyId, companyName, email, userId: existingUserId, status, inviteToken, invitedAt: now, acceptedAt, invitedBy, resendMsgId: null }
    );

    // ── Link existing user's profile ──────────────────────────────────────────
    if (isExistingUser && existingUserId) {
      await serverDb.updateDocument(USERS_DB_ID, USERS_COLLECTION_ID, existingUserId, { companyId, companyName })
        .catch((e) => console.error("[invite-employee] profile link failed:", e));
    }

    // ── Increment inviteCount (non-critical) ──────────────────────────────────
    serverDb.getDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, companyId)
      .then((co) => serverDb.updateDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, companyId, { inviteCount: ((co.inviteCount as number) || 0) + 1 }))
      .catch(() => {});

    // ── Build invite URL ──────────────────────────────────────────────────────
    const inviteUrl = `${APP_URL}/register?invite=${inviteToken}&company=${companyId}`;

    // ── Send email — same pattern as contact route (no .catch swallowing) ────
    let resendMsgId: string | null = null;
    let emailError: string | null  = null;

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
    } catch (e: any) {
      emailError = e?.message || "Email delivery failed";
      console.error("[invite-employee] Resend error:", emailError);
    }

    // ── Store resendMsgId ─────────────────────────────────────────────────────
    if (resendMsgId) {
      serverDb.updateDocument(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, memberDoc.$id, { resendMsgId }).catch(() => {});
    }

    return NextResponse.json({
      success:       true,
      memberId:      memberDoc.$id,
      status,
      isExistingUser,
      inviteUrl:     isExistingUser ? null : inviteUrl,
      emailSent:     !!resendMsgId,
      emailError,   // surface to client so UI shows fallback copy-link immediately
    });

  } catch (err: any) {
    console.error("[invite-employee API] Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to send invitation. Please try again." }, { status: 500 });
  }
}

// ── PATCH — claim invite (authService + register page safety-net both call this) ─
export async function PATCH(req: NextRequest) {
  try {
    const { inviteToken, userId } = await req.json();
    if (!inviteToken || !userId) {
      return NextResponse.json({ error: "inviteToken and userId are required." }, { status: 400 });
    }

    console.log("[invite-employee PATCH] claiming token:", inviteToken, "for user:", userId);

    // Retry once after a short delay — handles Appwrite indexing lag where the
    // member doc was just created milliseconds ago and may not appear yet
    let memberDoc: Record<string, any> | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1500));
      const res = await serverDb.listDocuments(
        USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID,
        [Query.equal("inviteToken", inviteToken), Query.limit(1)]
      ).catch(() => null);
      if (res && res.documents.length > 0) { memberDoc = res.documents[0]; break; }
    }

    if (!memberDoc) {
      console.warn("[invite-employee PATCH] member not found for token:", inviteToken);
      return NextResponse.json({ error: "Invite not found." }, { status: 404 });
    }

    const now = new Date().toISOString();

    // Idempotent: if already active just re-link profile and return success
    if (memberDoc.status === "active") {
      console.log("[invite-employee PATCH] already active, re-linking profile for:", userId);
      await serverDb.updateDocument(USERS_DB_ID, USERS_COLLECTION_ID, userId, {
        companyId: memberDoc.companyId, companyName: memberDoc.companyName,
      }).catch((e) => console.error("[claim] profile re-link failed:", e));
      // Also ensure userId is stamped on the member row
      if (!memberDoc.userId) {
        await serverDb.updateDocument(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, memberDoc.$id, { userId })
          .catch(() => {});
      }
      return NextResponse.json({ success: true, companyId: memberDoc.companyId, companyName: memberDoc.companyName, alreadyActive: true });
    }

    // Activate member record
    await serverDb.updateDocument(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, memberDoc.$id, {
      userId, status: "active", acceptedAt: now,
    });
    console.log("[invite-employee PATCH] activated member:", memberDoc.$id);

    // Link user profile to company
    await serverDb.updateDocument(USERS_DB_ID, USERS_COLLECTION_ID, userId, {
      companyId: memberDoc.companyId, companyName: memberDoc.companyName,
    }).catch((e) => console.error("[claim] profile link failed:", e));

    return NextResponse.json({ success: true, companyId: memberDoc.companyId, companyName: memberDoc.companyName });

  } catch (err: any) {
    console.error("[invite-employee PATCH] Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to claim invite." }, { status: 500 });
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function buildInviteEmail({ companyName, employerName, inviteUrl }: { companyName: string; employerName?: string; inviteUrl: string }): string {
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

function buildExistingUserEmail({ companyName, employerName, appUrl }: { companyName: string; employerName?: string; appUrl: string }): string {
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
          <a href="${appUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#0d9488,#059669);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">Go to My Dashboard</a>
        </div>
      </div>
      <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;">Health Master · info@healthmasterco.com</p>
    </div>`;
}