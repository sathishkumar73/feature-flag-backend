import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogService } from '../services/audit-logs.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditLogsController', () => {
  let controller: AuditLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditLogsController],
      providers: [AuditLogService, PrismaService],
    }).compile();

    controller = module.get<AuditLogsController>(AuditLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
