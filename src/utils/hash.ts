export function hashUserToBucket(userId: string): number {
    let hash = 2166136261; // FNV-1a offset basis
    for (let i = 0; i < userId.length; i++) {
      hash ^= userId.charCodeAt(i);
      // FNV prime multiplication with bit shifts
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    // Convert to positive 32-bit integer and mod 100 for bucket
    return Math.abs(hash >>> 0) % 100;
  }