import { NextResponse } from "next/server";
import { verifyOTPToken, generateClientSessionToken } from "@/lib/authHelper";

export async function POST(request: Request) {
  try {
    const { email, otp, token } = await request.json();
    if (!email || !otp || !token) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP
    const isValid = verifyOTPToken(cleanEmail, otp, token);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 });
    }

    // Generate JWT token for Flutter client
    const sessionToken = generateClientSessionToken(cleanEmail);

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      sessionToken
    });
  } catch (error) {
    console.error("[OTP Verify] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
