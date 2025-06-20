import { randomBytes } from 'crypto';

export function generateInviteToken(): string {
  // 8 bytes = 64 bits of entropy, base64url for short, URL-safe, readable tokens
  return randomBytes(8).toString('base64url');
}

export function verifyInviteToken(token: string, expectedToken: string): boolean {
  // Simple equality check for random tokens
  return token === expectedToken;
}
