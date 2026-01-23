export const internalContactTemplate = (data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) => `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background:#f5f7fa; padding:30px;">
  <tr>
    <td align="center">
      <table width="600" style="background:#ffffff; border-radius:8px; overflow:hidden;">
        <tr>
          <td style="background:#14b8a6; padding:20px; color:white;">
            <h2 style="margin:0;">New Contact Request</h2>
          </td>
        </tr>

        <tr>
          <td style="padding:24px;">
            <p><strong>Name:</strong> ${data.name}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone || "N/A"}</p>

            <hr style="margin:20px 0;" />

            <p><strong>Message:</strong></p>
            <p style="background:#f1f5f9; padding:15px; border-radius:6px;">
              ${data.message}
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc; padding:16px; text-align:center; font-size:12px; color:#64748b;">
            HealthMaster • Contact Form
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;


export const autoReplyTemplate = (name: string) => `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background:#f5f7fa; padding:30px;">
  <tr>
    <td align="center">
      <table width="600" style="background:#ffffff; border-radius:8px;">
        <tr>
          <td style="background:#14b8a6; padding:20px; color:white;">
            <h2 style="margin:0;">Thanks for contacting HealthMaster</h2>
          </td>
        </tr>

        <tr>
          <td style="padding:24px; color:#334155;">
            <p>Hi <strong>${name}</strong>,</p>

            <p>
              Thank you for reaching out to HealthMaster.  
              We’ve received your message and one of our specialists will
              contact you within <strong>24 hours</strong>.
            </p>

            <p>
              We’re excited to help you improve employee health and wellness.
            </p>

            <p style="margin-top:30px;">
              Warm regards,<br />
              <strong>HealthMaster Team</strong><br />
              📧 info@healthmasterco.com<br />
              📞 +250 789 399 765
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc; padding:16px; text-align:center; font-size:12px; color:#64748b;">
            © ${new Date().getFullYear()} HealthMaster
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
