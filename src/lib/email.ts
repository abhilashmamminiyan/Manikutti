import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvitationEmail(to: string, familyName: string, inviteLink: string) {
  const token = inviteLink.split('token=')[1] || '';
  const mailOptions = {
    from: `"Manikutti Finance" <${process.env.SMTP_USER}>`,
    to,
    subject: `Join the ${familyName} Family Sanctuary`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4F46E5;">Welcome to Manikutti!</h2>
        <p>You have been invited to join the <strong>${familyName}</strong> family group to track collective prosperity.</p>
        
        <!-- Mobile Invite Token copy box -->
        <div style="background-color: #f8fafc; border: 1px dashed #4F46E5; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #64748b; font-weight: bold;">Mobile App Invitation Code:</p>
          <code style="font-family: monospace; font-size: 12px; font-weight: bold; color: #4F46E5; word-break: break-all; display: block; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e2e8f0;">${token}</code>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #94a3b8;">Copy this code and paste it into your mobile app when prompted.</p>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${inviteLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Family Sanctuary (Web)</a>
        </div>
        <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #666; word-break: break-all;">${inviteLink}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999;">This invitation was sent by Manikutti Finance Tracker. If you weren't expecting this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error };
  }
}

export async function sendOTPEmail(to: string, otp: string, isMobile: boolean = false) {
  const subject = isMobile
    ? `🔑 Your Verification Code: ${otp}`
    : `🔐 Your Admin Access Code: ${otp}`;

  const headerTitle = isMobile
    ? `✨ Manikutti Finance`
    : `✨ Manikutti Finance Admin`;

  const greeting = isMobile ? `Hello,` : `Hello Admin,`;

  const bodyText = isMobile
    ? `A request was made to sign into your Manikutti Finance account. Use the security verification code below to authorize your session:`
    : `A login attempt was made to your dashboard ledger. Use the security verification code below to authorize this session:`;

  const footerText = isMobile
    ? `Automated System • Manikutti Personal & Family Finance`
    : `Automated System • Secure Family Dashboard`;

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Manikutti Finance" <${process.env.SMTP_USER}>`,
    to: to,
    subject: subject,
    text: `Your 6-digit verification code is: ${otp}. It expires in 10 minutes.`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${isMobile ? 'User Verification' : 'Admin Verification'}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f9fafb; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" id="email-container" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                
                <!-- Header Banner -->
                <tr>
                  <td style="background-color: #006972; padding: 32px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.025em;">
                      ${headerTitle}
                    </h1>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #334155; font-weight: 500;">
                      ${greeting}
                    </p>
                    <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 24px; color: #64748b;">
                      ${bodyText}
                    </p>

                    <!-- OTP Display Box -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                      <tr>
                        <td align="center" style="background-color: #f8fafc; border: 2px dashed #006972; border-radius: 12px; padding: 24px;">
                          <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 6px; color: #006972;">
                            ${otp}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
                      ⏳ This verification code is single-use and will expire in 10 minutes.
                    </p>
                    <p style="margin: 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
                      🛡️ If you did not request this code, please disregard this message safely.
                    </p>
                  </td>
                </tr>

                <!-- Footer Section -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                      ${footerText}
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error };
  }
}

