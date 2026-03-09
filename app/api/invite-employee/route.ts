// app/api/invite-employee/route.ts
// Server-side only — Resend API key never exposed to client

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { Client, Databases } from "node-appwrite";
import { inviteEmployee } from "@/services/companyService";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://hmex.vercel.app";

// Server-side Appwrite client (elevated permissions for writing company_members)
const serverClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!.replace(/\/$/, ""))
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const serverDb = new Databases(serverClient);

export async function POST(req: NextRequest) {
  try {
    const { employeeEmail, companyName, companyId, employerName, invitedBy } = await req.json();

    // Validation
    if (!employeeEmail || !companyName || !companyId || !invitedBy) {
      return NextResponse.json(
        { error: "employeeEmail, companyName, companyId, and invitedBy are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeEmail)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // 1. Create the pending company_members record via client-side service
    //    (uses the server Appwrite key passed via env — companyService uses client SDK,
    //     so we create the record directly here with the server SDK instead)
    const inviteToken = crypto.randomUUID();
    const USERS_DB_ID                   = "hmex_db";
    const COMPANY_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_MEMBERS_COLLECTION_ID!;

    const memberDoc = await serverDb.createDocument(
      USERS_DB_ID,
      COMPANY_MEMBERS_COLLECTION_ID,
      // ID.unique() equivalent — we use crypto here since node-appwrite ID is available
      crypto.randomUUID().replace(/-/g, "").slice(0, 20),
      {
        companyId,
        companyName,
        email:       employeeEmail.toLowerCase().trim(),
        userId:      null,
        status:      "pending",
        inviteToken,
        invitedAt:   new Date().toISOString(),
        acceptedAt:  null,
        invitedBy,
        resendMsgId: null,
      }
    );

    // 2. Build the invite URL
    const inviteUrl = `${APP_URL}/register?invite=${inviteToken}&company=${companyId}`;

    // 3. Send invite email via Resend (same style as your contact route)
    const emailResponse = await resend.emails.send({
      from:    "Health Master <no-reply@healthmasterco.com>",
      to:      employeeEmail,
      subject: `${employerName || companyName} has invited you to join ${companyName} on HMEX`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">

          <div style="background: linear-gradient(135deg, #0d9488, #059669); border-radius: 8px; padding: 32px 24px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">You're invited to join ${companyName}</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">${employerName ? `${employerName} has` : `${companyName} has`} invited you to HMEX</p>
          </div>

          <div style="background: white; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #334155; line-height: 1.7; margin: 0 0 16px;">
              Hi there! ${employerName ? `<strong>${employerName}</strong> from` : ""} <strong>${companyName}</strong> has invited you to join their team on HMEX — a free platform for health assessments and personalised wellness insights.
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.7; margin: 0 0 24px;">
              Your health data is <strong>completely private</strong>. Your employer only ever sees anonymised team-level insights — never your individual results.
            </p>

            <div style="text-align: center;">
              <a href="${inviteUrl}"
                style="display: inline-block; background: linear-gradient(135deg, #0d9488, #059669); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.02em;">
                Accept Invitation &amp; Create Account
              </a>
            </div>
          </div>

          <div style="background: white; border-radius: 8px; padding: 16px 24px; border: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.6;">
              If the button doesn't work, copy this link into your browser:<br/>
              <a href="${inviteUrl}" style="color: #0d9488; word-break: break-all;">${inviteUrl}</a>
            </p>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 20px 0 0;">
            If you were not expecting this invitation, you can safely ignore this email.<br/>
            Health Master · Norrsken House Kigali · info@healthmasterco.com
          </p>
        </div>
      `,
    });

    // 4. Store the Resend message ID for delivery tracking
    if (emailResponse.data?.id) {
      await serverDb.updateDocument(
        USERS_DB_ID,
        COMPANY_MEMBERS_COLLECTION_ID,
        memberDoc.$id,
        { resendMsgId: emailResponse.data.id }
      ).catch(() => { /* non-critical */ });
    }

    return NextResponse.json({ success: true, memberId: memberDoc.$id });

  } catch (err) {
    console.error("[invite-employee API] Error:", err);
    return NextResponse.json(
      { error: "Failed to send invitation. Please try again." },
      { status: 500 }
    );
  }
}