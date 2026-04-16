import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.WAITLIST_RECEIVER_EMAIL || "irene.dushime@healthmasterco.com";

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    await resend.emails.send({
      from: "Health Master Waitlist <no-reply@healthmasterco.com>",
      to: TO_EMAIL,
      replyTo: email,
      subject: `New waitlist signup: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f7fafc; border-radius: 12px;">
          <div style="background: #0f766e; color: white; padding: 20px; border-radius: 12px;">
            <h1 style="margin:0; font-size:20px;">New Waitlist Signup</h1>
            <p style="margin:6px 0 0; opacity:.9;">A user expressed interest in early HMEX access.</p>
          </div>
          <div style="background: white; border-radius: 12px; padding: 20px; margin-top: 18px; border: 1px solid #e2e8f0;">
            <p style="margin:0 0 10px; font-size: 14px;"><strong>Name:</strong> ${name}</p>
            <p style="margin:0 0 10px; font-size: 14px;"><strong>Email:</strong> <a href=\"mailto:${email}\" style=\"color:#0f766e;\">${email}</a></p>
            <p style="margin:0; font-size: 14px;"><strong>Note:</strong> User is joining the HMEX waitlist.</p>
          </div>
          <p style="margin:20px 0 0; font-size:12px; color:#64748b;">Reply directly to the applicant using the email address above.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Waitlist API] Error:", err);
    return NextResponse.json({ error: "Unable to submit waitlist request." }, { status: 500 });
  }
}
