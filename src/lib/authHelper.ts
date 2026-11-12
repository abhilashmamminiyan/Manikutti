import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { getFirestoreDb } from "./firebaseAdmin";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-use-only";

interface AuthVersionCacheEntry {
  tokenVersion: number;
  accessCodeActive: boolean;
  cachedAt: number;
}
const authVersionCache = new Map<string, AuthVersionCacheEntry>();
const AUTH_CACHE_TTL_MS = 45 * 1000;

export function invalidateUserAuthCache(email: string): void {
  authVersionCache.delete(email.trim().toLowerCase());
}

async function getUserAuthState(email: string): Promise<{ tokenVersion: number; accessCodeActive: boolean } | null> {
  const cleanEmail = email.trim().toLowerCase();
  const cached = authVersionCache.get(cleanEmail);
  if (cached && Date.now() - cached.cachedAt < AUTH_CACHE_TTL_MS) {
    return { tokenVersion: cached.tokenVersion, accessCodeActive: cached.accessCodeActive };
  }

  const db = getFirestoreDb();
  if (!db) return null;
  try {
    const snap = await db.collection("users").doc(cleanEmail).get();
    if (!snap.exists) return null;
    const data = snap.data() as Record<string, unknown>;
    const entry: AuthVersionCacheEntry = {
      tokenVersion: typeof data.tokenVersion === "number" ? data.tokenVersion : 0,
      accessCodeActive: data.accessCodeActive !== false,
      cachedAt: Date.now(),
    };
    authVersionCache.set(cleanEmail, entry);
    return { tokenVersion: entry.tokenVersion, accessCodeActive: entry.accessCodeActive };
  } catch {
    return null;
  }
}

export function sha256(text: string): string {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export function generateOTPToken(email: string, otp: string): string {
  const otpHash = sha256(otp);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  return jwt.sign({ email, otpHash, expiresAt }, JWT_SECRET);
}

export function verifyOTPToken(email: string, otp: string, token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; otpHash: string; expiresAt: number };
    if (decoded.email.toLowerCase() !== email.toLowerCase()) return false;
    if (Date.now() > decoded.expiresAt) return false;
    return decoded.otpHash === sha256(otp);
  } catch (e) {
    return false;
  }
}

// Generate a long-lived JWT token for the Flutter client
export function generateClientSessionToken(email: string, tokenVersion?: number): string {
  const payload: Record<string, unknown> = { email, role: "user" };
  if (typeof tokenVersion === "number") {
    payload.tokenVersion = tokenVersion;
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "90d" });
}

// Extract email from NextAuth session or Bearer token
export async function getAuthUserEmail(request: Request): Promise<string | null> {
  // 1. Check Authorization header (Flutter app)
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { email: string; tokenVersion?: number };
      if (!decoded.email) return null;
      if (typeof decoded.tokenVersion === "number") {
        const state = await getUserAuthState(decoded.email);
        if (state) {
          if (!state.accessCodeActive || state.tokenVersion > decoded.tokenVersion) {
            return null;
          }
        }
      }
      return decoded.email;
    } catch (e) {
      console.error("[AuthHelper] Failed to verify Bearer token:", e);
      return null;
    }
  }

  // 2. Check NextAuth Session (Web Dashboard)
  try {
    const session = await getServerSession(authOptions) as any;
    return session?.user?.email || null;
  } catch (e) {
    console.error("[AuthHelper] Failed to get session:", e);
    return null;
  }
}

export function parsePrivateKey(rawKey: string | undefined): string | undefined {
  if (!rawKey) return undefined;
  
  let key = rawKey.trim();
  
  // Strip trailing comma if copied directly from a JSON file
  if (key.endsWith(',')) {
    key = key.substring(0, key.length - 1).trim();
  }
  
  // Clean surrounding quotes (repeating in case of nested quotes)
  let prevKey = '';
  while (key !== prevKey) {
    prevKey = key;
    if (key.startsWith('"') && key.endsWith('"')) {
      key = key.substring(1, key.length - 1).trim();
    }
    if (key.startsWith("'") && key.endsWith("'")) {
      key = key.substring(1, key.length - 1).trim();
    }
  }
  
  return key.replace(/\\n/g, '\n');
}
