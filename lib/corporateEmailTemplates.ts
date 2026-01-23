type CorporateData = {
  name: string;
  department: string;
  organization: string;
  employeeCount: string;
  email: string;
  phone: string;
  preferredDate?: string;
};

export const internalCorporateTemplate = (data: CorporateData) => `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background:#f5f7fa;padding:30px;">
  <tr>
    <td align="center">
      <table width="620" style="background:#ffffff;border-radius:10px;overflow:hidden;">
        <tr>
          <td style="background:#14b8a6;padding:20px;color:white;">
            <h2 style="margin:0;">New Corporate Demo Request</h2>
          </td>
        </tr>

        <tr>
          <td style="padding:24px;color:#334155;">
            <p><strong>Organization:</strong> ${data.organization}</p>
            <p><strong>Contact Person:</strong> ${data.name}</p>
            <p><strong>Department:</strong> ${data.department}</p>
            <p><strong>Employees:</strong> ${data.employeeCount}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Preferred Date:</strong> ${data.preferredDate || "Not specified"}</p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;">
            HealthMaster • Corporate Sales
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

export const corporateAutoReplyTemplate = (name: string) => `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;background:#f5f7fa;padding:30px;">
  <tr>
    <td align="center">
      <table width="620" style="background:#ffffff;border-radius:10px;">
        <tr>
          <td style="background:#14b8a6;padding:20px;color:white;">
            <h2 style="margin:0;">Your Demo Request Is Confirmed</h2>
          </td>
        </tr>

        <tr>
          <td style="padding:24px;color:#334155;">
            <p>Hi <strong>${name}</strong>,</p>

            <p>
              Thank you for requesting a corporate demo with <strong>HealthMaster</strong>.
              Our team will contact you within <strong>24 hours</strong> to confirm
              the best time for your personalized session.
            </p>

            <p>
              In the meantime, you can learn more about how we support employee health
              and wellness across organizations of all sizes.
            </p>

            <p style="margin-top:24px;">
              Best regards,<br />
              <strong>HealthMaster Corporate Team</strong><br />
              info@healthmasterco.com<br />
              +250 789 399 765
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f8fafc;padding:16px;text-align:center;font-size:12px;color:#64748b;">
            © ${new Date().getFullYear()} HealthMaster
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;
