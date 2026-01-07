type ContactEmailProps = {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
};

export const contactEmailTemplate = ({
  name,
  email,
  phone,
  service,
  message,
}: ContactEmailProps) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background: #f97316;
          color: white;
          padding: 20px;
          text-align: center;
        }
        .content {
          padding: 20px;
          color: #333;
        }
        .content p {
          line-height: 1.6;
        }
        .label {
          font-weight: bold;
          color: #555;
        }
        .footer {
          background: #f9f9f9;
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Contact Request</h2>
        </div>

        <div class="content">
          <p><span class="label">Name:</span> ${name}</p>
          <p><span class="label">Email:</span> ${email}</p>
          <p><span class="label">Phone:</span> ${phone}</p>
          <p><span class="label">Service:</span> ${service}</p>
          <p><span class="label">Message:</span><br/>${message}</p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};
