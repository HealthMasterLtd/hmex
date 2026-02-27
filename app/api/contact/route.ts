import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || "info@healthmasterco.com";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json();

    // Basic validation
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Send notification email to HMEX team
    await resend.emails.send({
      from: "Health Master Contact <no-reply@healthmasterco.com>", // use your domain here once verified e.g. contact@healthmasterco.com
      to: TO_EMAIL,
      replyTo: email,                               // hitting Reply goes straight to the user
      subject: `New Contact Message from ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
          
          <div style="background: linear-gradient(135deg, #0d9488, #059669); border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">New Contact Message</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">via Health Master Contact Form</p>
          </div>

          <div style="background: white; border-radius: 8px; padding: 24px; margin-bottom: 16px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; width: 100px;">
                  <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">Name</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="font-size: 14px; color: #1e293b; font-weight: 500;">${name}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">Email</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                  <a href="mailto:${email}" style="font-size: 14px; color: #0d9488;">${email}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8;">Phone</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="font-size: 14px; color: #1e293b;">${phone || "—"}</span>
                </td>
              </tr>
            </table>
          </div>

          <div style="background: white; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin: 0 0 12px;">Message</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.7; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 20px 0 0;">
            Reply directly to this email to respond to ${name}.
          </p>
        </div>
      `,
    });

    // Send auto-reply confirmation to the user
    await resend.emails.send({
      from: "Health Master <no-reply@healthmasterco.com>", // replace with your domain once verified
      to: email,
      subject: "We received your message — Health Master ",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 12px;">
          
          <div style="background: linear-gradient(135deg, #0d9488, #059669); border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">Thanks, ${name}!</h1>
            <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">We've received your message.</p>
          </div>

          <div style="background: white; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
            <p style="font-size: 14px; color: #334155; line-height: 1.7; margin: 0 0 16px;">
              Hi ${name}, thanks for reaching out to Health Master. We've received your message and our team will get back to you within <strong>24 hours</strong>.
            </p>
            <p style="font-size: 14px; color: #334155; line-height: 1.7; margin: 0;">
              In the meantime, you can learn more about our health monitoring tools at 
              <a href="https://hmex.vercel.app" style="color: #0d9488;">Health Master</a>.
            </p>
          </div>

          <div style="background: white; border-radius: 8px; padding: 20px 24px; margin-top: 16px; border: 1px solid #e2e8f0;">
            <p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; margin: 0 0 8px;">Your message</p>
            <p style="font-size: 13px; color: #64748b; line-height: 1.7; margin: 0; white-space: pre-wrap; font-style: italic;">"${message}"</p>
          </div>

          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 20px 0 0;">
            Health Master · Norrsken House Kigali · info@healthmasterco.com
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[Contact API] Error:", err);
    return NextResponse.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }
}