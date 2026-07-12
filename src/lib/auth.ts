import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { verifyOTPToken } from "./authHelper"

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
        token: { label: "Token", type: "text" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp || !credentials?.token) {
          throw new Error("Missing credentials");
        }

        const email = credentials.email.toLowerCase().trim();
        
        // Allowed Admin check
        const adminEmailsStr = process.env.ADMIN_EMAILS || "dev.abhilashm@gmail.com";
        const adminEmails = adminEmailsStr.split(",").map(e => e.trim().toLowerCase());
        
        if (!adminEmails.includes(email)) {
          throw new Error("Unauthorized admin email");
        }

        // Verify the OTP using the stateless token
        const isValid = verifyOTPToken(email, credentials.otp, credentials.token);
        if (!isValid) {
          throw new Error("Invalid or expired OTP");
        }

        return {
          id: email,
          email: email,
          name: "Admin"
        };
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email;
      }
      return session;
    },
  },
}

