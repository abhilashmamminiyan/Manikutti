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
  const mailOptions = {
    from: `"Manikutti Finance" <${process.env.SMTP_USER}>`,
    to,
    subject: `Join the ${familyName} Family Sanctuary`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #4F46E5;">Welcome to Manikutti!</h2>
        <p>You have been invited to join the <strong>${familyName}</strong> family group to track collective prosperity.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${inviteLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Family Sanctuary</a>
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
