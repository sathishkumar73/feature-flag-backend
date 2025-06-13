import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagController } from './feature-flag.controller';
import { FeatureFlagService } from '../services/feature-flag.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../audit-logs/services/audit-logs.service';

describe('FeatureFlagController', () => {
  let controller: FeatureFlagController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeatureFlagController],
      providers: [FeatureFlagService, PrismaService, AuditLogService],
    }).compile();

    controller = module.get<FeatureFlagController>(FeatureFlagController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
