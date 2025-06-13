import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagService } from './feature-flag.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../audit-logs/services/audit-logs.service';
import { FeatureFlag } from '@prisma/client';

const mockPrisma = {
  featureFlag: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
};
const mockAuditLogService = { logAuditAction: jest.fn() };

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();
    service = module.get<FeatureFlagService>(FeatureFlagService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isFlagEnabledForUser', () => {
    it('returns false if flag not found', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue(null);
      await expect(
        service['isFlagEnabledForUser']('flag1', 'user1'),
      ).rejects.toThrow('Feature flag not found');
    });
    it('returns false if flag is globally disabled', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        enabled: false,
      } as FeatureFlag);
      const result = await service['isFlagEnabledForUser']('flag1', 'user1');
      expect(result).toBe(false);
    });
    it('returns true if rolloutPercentage is 100', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        enabled: true,
        rolloutPercentage: 100,
      } as FeatureFlag);
      const result = await service['isFlagEnabledForUser']('flag1', 'user1');
      expect(result).toBe(true);
    });
    it('returns false if rolloutPercentage is 0', async () => {
      mockPrisma.featureFlag.findUnique.mockResolvedValue({
        enabled: true,
        rolloutPercentage: 0,
      } as FeatureFlag);
      const result = await service['isFlagEnabledForUser']('flag1', 'user1');
      expect(result).toBe(false);
    });
  });
});
