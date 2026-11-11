import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging, type SendResponse } from 'firebase-admin/messaging';

function parseServiceAccountFromEnv(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw || !raw.trim()) {
    return null;
  }

  let jsonString = raw.trim();
  if (!jsonString.startsWith('{')) {
    try {
      jsonString = Buffer.from(jsonString, 'base64').toString('utf8').trim();
    } catch {
      return null;
    }
  }

  try {
    const parsed = JSON.parse(jsonString) as ServiceAccount & { private_key?: string; project_id?: string };
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    if (!parsed.projectId && !parsed.project_id) {
      return null;
    }
    return parsed;
  } catch (err) {
    console.error('[FirebaseAdmin] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', err);
    return null;
  }
}

export function getFirebaseApp(): App | null {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0] || null;
  }

  const serviceAccount = parseServiceAccountFromEnv();
  if (!serviceAccount) {
    return null;
  }

  try {
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (err) {
    console.error('[FirebaseAdmin] initializeApp failed:', err);
    return null;
  }
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseApp() !== null;
}

export function getFirestoreDb(): Firestore | null {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch (err) {
    console.error('[FirebaseAdmin] getFirestoreDb failed:', err);
    return null;
  }
}

export function getFirebaseMessaging(): Messaging | null {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getMessaging(app);
  } catch (err) {
    console.error('[FirebaseAdmin] getFirebaseMessaging failed:', err);
    return null;
  }
}

export interface FcmPushPayload {
  title: string;
  body: string;
  channelId?: string;
  data?: Record<string, string>;
}

/**
 * Look up FCM device tokens stored in Firestore `users/{email}.fcmTokens`
 * and send push notifications cleanly in batches while pruning stale tokens.
 */
export async function sendFcmToUsers(
  emails: string[],
  payload: FcmPushPayload
): Promise<{ sent: number; failed: number; skipped?: string }> {
  const db = getFirestoreDb();
  const messaging = getFirebaseMessaging();
  if (!db || !messaging) {
    return { sent: 0, failed: 0, skipped: 'firebase_not_configured' };
  }

  const cleanEmails = Array.from(
    new Set(
      emails
        .map((e) => (e || '').trim().toLowerCase())
        .filter((e) => e.includes('@'))
    )
  );
  if (cleanEmails.length === 0) {
    return { sent: 0, failed: 0, skipped: 'no_recipients' };
  }

  const tokenToEmail = new Map<string, string>();
  const docRefs = cleanEmails.map((email) => db.collection('users').doc(email));

  try {
    const snapshots = await db.getAll(...docRefs);
    for (const snap of snapshots) {
      if (!snap.exists) continue;
      const data = snap.data() || {};
      const tokens: unknown = data.fcmTokens;
      if (Array.isArray(tokens)) {
        for (const t of tokens) {
          if (typeof t === 'string' && t.trim().length > 0) {
            tokenToEmail.set(t.trim(), snap.id);
          }
        }
      }
    }
  } catch (err) {
    console.error('[FirebaseAdmin] Failed reading user FCM tokens from Firestore:', err);
    return { sent: 0, failed: 0, skipped: 'firestore_read_error' };
  }

  const allTokens = Array.from(tokenToEmail.keys());
  if (allTokens.length === 0) {
    return { sent: 0, failed: 0, skipped: 'no_tokens' };
  }

  let sent = 0;
  let failed = 0;
  const staleTokensByEmail = new Map<string, string[]>();

  for (let i = 0; i < allTokens.length; i += 500) {
    const batchTokens = allTokens.slice(i, i + 500);
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: batchTokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: payload.channelId || 'payment_channel',
            sound: 'default',
          },
        },
      });

      sent += response.successCount;
      failed += response.failureCount;

      response.responses.forEach((resp: SendResponse, idx: number) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            const badToken = batchTokens[idx];
            const owner = tokenToEmail.get(badToken);
            if (owner) {
              const existing = staleTokensByEmail.get(owner) || [];
              existing.push(badToken);
              staleTokensByEmail.set(owner, existing);
            }
          }
        }
      });
    } catch (err) {
      console.error('[FirebaseAdmin] sendEachForMulticast error:', err);
      failed += batchTokens.length;
    }
  }

  // Prune stale tokens asynchronously so broken tokens are removed
  if (staleTokensByEmail.size > 0) {
    await Promise.all(
      Array.from(staleTokensByEmail.entries()).map(async ([email, badTokens]) => {
        try {
          await db.collection('users').doc(email).set(
            {
              fcmTokens: FieldValue.arrayRemove(...badTokens),
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch (err) {
          console.error(`[FirebaseAdmin] Failed pruning stale tokens for ${email}:`, err);
        }
      })
    );
  }

  return { sent, failed };
}
