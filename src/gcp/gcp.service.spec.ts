import { Test, TestingModule } from '@nestjs/testing';
import { GcpService } from './gcp.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { REQUIRED_GCP_SERVICES } from './types/service-types';
import { EncryptionService } from '../utils/encryption';

// Mock the googleapis module
jest.mock('googleapis', () => ({
  google: {
    serviceusage: jest.fn(() => ({
      services: {
        get: jest.fn(),
        enable: jest.fn(),
      },
    })),
    auth: {
      OAuth2: jest.fn(() => ({
        setCredentials: jest.fn(),
      })),
    },
  },
}));

// Mock the EncryptionService
jest.mock('../utils/encryption', () => ({
  EncryptionService: {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
}));

describe('GcpService', () => {
  let service: GcpService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    gcpConnection: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GcpService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<GcpService>(GcpService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Mock EncryptionService methods
    (EncryptionService.decrypt as jest.Mock).mockResolvedValue('decrypted-token');
    (EncryptionService.encrypt as jest.Mock).mockResolvedValue('encrypted-token');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getServices', () => {
    it('should throw error when no GCP connection found', async () => {
      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(null);

      await expect(service.getServices('user123')).rejects.toThrow(
        new HttpException('No GCP connection found', HttpStatus.NOT_FOUND)
      );
    });

    it('should throw error when no active project selected', async () => {
      mockPrismaService.gcpConnection.findUnique.mockResolvedValue({
        id: 'conn123',
        userId: 'user123',
        activeProjectId: null,
      });

      await expect(service.getServices('user123')).rejects.toThrow(
        new HttpException('No active project selected', HttpStatus.BAD_REQUEST)
      );
    });
  });

  describe('enableService', () => {
    it('should throw error for unknown service', async () => {
      // Mock a valid GCP connection
      mockPrismaService.gcpConnection.findUnique.mockResolvedValue({
        id: 'conn123',
        userId: 'user123',
        accessToken: 'encrypted-token',
        refreshToken: 'encrypted-refresh-token',
        expiresAt: new Date(Date.now() + 3600000), // Valid token
        activeProjectId: 'project123'
      });

      await expect(
        service.enableService('user123', 'unknown-service', 'project123')
      ).rejects.toThrow(
        new HttpException('Unknown service: unknown-service', HttpStatus.BAD_REQUEST)
      );
    });

    it('should throw error when no GCP connection found', async () => {
      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(null);

      await expect(
        service.enableService('user123', 'run', 'project123')
      ).rejects.toThrow(
        new HttpException('No GCP connection found', HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('enableAllServices', () => {
    it('should throw error when no GCP connection found', async () => {
      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(null);

      await expect(
        service.enableAllServices('user123', 'project123')
      ).rejects.toThrow(
        new HttpException('No GCP connection found', HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('getServiceStatus', () => {
    it('should throw error when no GCP connection found', async () => {
      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(null);

      await expect(
        service.getServiceStatus('user123', 'run')
      ).rejects.toThrow(
        new HttpException('No GCP connection found', HttpStatus.NOT_FOUND)
      );
    });

    it('should throw error when no active project selected', async () => {
      mockPrismaService.gcpConnection.findUnique.mockResolvedValue({
        id: 'conn123',
        userId: 'user123',
        activeProjectId: null,
      });

      await expect(
        service.getServiceStatus('user123', 'run')
      ).rejects.toThrow(
        new HttpException('No active project selected', HttpStatus.BAD_REQUEST)
      );
    });
  });

  describe('REQUIRED_GCP_SERVICES', () => {
    it('should contain all required services', () => {
      const serviceNames = REQUIRED_GCP_SERVICES.map(s => s.name);
      expect(serviceNames).toContain('run');
      expect(serviceNames).toContain('storage-api');
      expect(serviceNames).toContain('cloudbuild');
      expect(serviceNames).toContain('monitoring');
      expect(serviceNames).toContain('iam');
    });

    it('should have correct service configurations', () => {
      const runService = REQUIRED_GCP_SERVICES.find(s => s.name === 'run');
      expect(runService).toBeDefined();
      expect(runService?.displayName).toBe('Cloud Run API');
      expect(runService?.required).toBe(true);
      expect(runService?.estimatedEnableTime).toBe(30);
    });
  });
}); 