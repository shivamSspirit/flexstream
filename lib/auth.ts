import { auth as clerkAuth } from '@clerk/nextjs/server';
import { verifyPumpFunToken } from '@/lib/jwt';

export type AuthResult = { userId?: string | null; email?: string | null };

// Lightweight JWT-based auth helper.
// Reads Authorization: Bearer <token> or x-wallet-address header.
export async function auth(req?: Request): Promise<AuthResult> {
  try {
    // Prefer Clerk session if available
    try {
      const { userId } = await clerkAuth();
      if (userId) {
        const email = `user-${userId}@flexstream.app`;
        return { userId, email };
      }
    } catch (_e) {
      // ignore, fall back to JWT / header
    }
    const bearer = req?.headers?.get('authorization') || req?.headers?.get('Authorization');
    if (bearer && bearer.startsWith('Bearer ')) {
      const token = bearer.slice('Bearer '.length).trim();
      const payload = verifyPumpFunToken(token);
      return { userId: payload.userId, email: payload.email || null };
    }

    const walletAddress = req?.headers?.get('x-wallet-address');
    if (walletAddress) {
      const email = `user-${walletAddress}@flexstream.app`;
      return { userId: walletAddress, email };
    }
  } catch (_err) {
    // fall through to unauthenticated
  }
  return { userId: undefined, email: undefined };
}


