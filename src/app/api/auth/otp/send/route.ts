import { NextResponse } from "next/server";
import { generateOTPToken } from "@/lib/authHelper";
import { sendOTPEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email, clientType } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isMobile = clientType === "mobile" || clientType === "user";
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generate stateless verification token
    const verificationToken = generateOTPToken(cleanEmail, otp);
    
    // Send email with appropriate layout (user vs admin)
    const emailResult = await sendOTPEmail(cleanEmail, otp, isMobile);
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
