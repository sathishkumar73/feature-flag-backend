import { hashUserToBucket } from './hash';

describe('hashUserToBucket', () => {
  it('should return a number between 0 and 99', () => {
    for (const userId of ['user1', 'user2', 'abc123', 'test']) {
      const bucket = hashUserToBucket(userId);
      expect(bucket).toBeGreaterThanOrEqual(0);
      expect(bucket).toBeLessThan(100);
    }
  });

  it('should be deterministic', () => {
    const userId = 'consistentUser';
    expect(hashUserToBucket(userId)).toBe(hashUserToBucket(userId));
  });
});
