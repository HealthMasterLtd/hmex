import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const TO_EMAIL = process.env.CONTACT_RECEIVER_EMAIL || "info@healthmasterco.com";

export async function POST(req: NextRequest) {
  try {
    const { name, department, organization, employeeCount, email, phone, preferredDate } =
      await req.json();

    // Basic validation
    if (!name || !email || !organization) {
      return NextResponse.json(
        { error: "Name, email, and organisation are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // ── Notification to HMEX team ──────────────────────────────────────────
    await resend.emails.send({
      from: "Health Master Corporate <no-reply@healthmasterco.com>",
      to: TO_EMAIL,
      replyTo: email,
      subject: `New Corporate Demo Request — ${organization}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    max-width: 600px; margin: 0 auto; padding: 24px;
                    background: #f8fafc; border-radius: 12px;">

          <div style="background: linear-gradient(135deg, #0d9488, #059669);
                      border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 20px; font-weight: 700;">
              New Corporate Demo Request
            </h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">
              via Health Master Corporate Page
            </p>
          </div>

          <div style="background: white; border-radius: 8px; padding: 24px;
                      margin-bottom: 16px; border: 1px solid #e2e8f0;">
            <table style="width: 100%; border-collapse: collapse;">
              ${[
                ["Name",           name],
                ["Organisation",   organization],
                ["Department",     department || "—"],
                ["Employees",      employeeCount || "—"],
                ["Email",          email],
                ["Phone",          phone || "—"],
                ["Preferred Date", preferredDate || "—"],
              ]
                .map(
                  ([label, value]) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;width:130px;">
                    <span style="font-size:11px;font-weight:600;text-transform:uppercase;
                                 letter-spacing:0.1em;color:#94a3b8;">${label}</span>
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">
                    <span style="font-size:14px;color:#1e293b;font-weight:500;">${value}</span>
                  </td>
                </tr>`
                )
                .join("")}
            </table>
          </div>

          <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;">
            Reply directly to this email to respond to ${name}.
          </p>
        </div>
      `,
    });

    // ── Auto-reply to the requester ────────────────────────────────────────
    await resend.emails.send({
      from: "Health Master <no-reply@healthmasterco.com>",
      to: email,
      subject: `Your demo request is confirmed — Health Master`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    max-width: 600px; margin: 0 auto; padding: 24px;
                    background: #f8fafc; border-radius: 12px;">

          <div style="background: linear-gradient(135deg, #0d9488, #059669);
                      border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 700;">
              Demo Booked, ${name.split(" ")[0]}!
            </h1>
            <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px;">
              We'll reach out within 24 hours to confirm your session.
            </p>
          </div>

          <div style="background: white; border-radius: 8px; padding: 24px;
                      border: 1px solid #e2e8f0;">
            <p style="font-size:14px;color:#334155;line-height:1.7;margin:0 0 16px;">
              Hi ${name.split(" ")[0]}, thanks for requesting a demo for
              <strong>${organization}</strong>. Our team is excited to show you
              how HMEX can transform wellness across your workforce.
            </p>
            <p style="font-size:14px;color:#334155;line-height:1.7;margin:0;">
              We'll confirm your session${preferredDate ? ` around <strong>${preferredDate}</strong>` : ""} and
              send a calendar invite shortly. In the meantime, explore
              <a href="https://hmex.healthmasterco.com" style="color:#0d9488;">Health Master</a>.
            </p>
          </div>

          <p style="font-size:12px;color:#94a3b8;text-align:center;margin:20px 0 0;">
            Health Master · Norrsken House Kigali · info@healthmasterco.com
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Corporate Demo API] Error:", err);
    return NextResponse.json(
      { error: "Failed to send request. Please try again." },
      { status: 500 }
    );
  }
}