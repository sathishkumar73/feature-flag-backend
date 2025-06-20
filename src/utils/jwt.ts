import * as jwt from 'jsonwebtoken';

const INVITE_SECRET = process.env.INVITE_SECRET || 'supersecret'; // Use a secure env var in production
const INVITE_EXPIRY = '7d'; // 7 days, adjust as needed

export function generateInviteToken(email: string): string {
  return jwt.sign({ email }, INVITE_SECRET, { expiresIn: INVITE_EXPIRY });
}

export function verifyInviteToken(token: string): { email: string } {
  return jwt.verify(token, INVITE_SECRET) as { email: string };
}
