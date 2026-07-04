import { NextResponse } from "next/server";
import { generateOTPToken } from "@/lib/authHelper";
import { sendOTPEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    
    // Check if email is admin or family member
    // In our system, family members are registered in the admin spreadsheet,
    // and admins are listed in ADMIN_EMAILS. For sending OTP, anyone with a valid email
    // can request one. The validation of whether they are allowed to log in/register
    // is checked during verify/credentials auth or spreadsheet creation.
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generate stateless verification token
    const verificationToken = generateOTPToken(cleanEmail, otp);
    
    // Send email
    const emailResult = await sendOTPEmail(cleanEmail, otp);
    if (!emailResult.success) {
      console.error("[OTP Send] Email sending failed:", emailResult.error);
      return NextResponse.json({ error: "Failed to send verification email. Please check your SMTP settings." }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      token: verificationToken 
    });
  } catch (error) {
    console.error("[OTP Send] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
