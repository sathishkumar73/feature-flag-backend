import { Test, TestingModule } from '@nestjs/testing';
import { GcpService } from './gcp.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    storage: jest.fn(() => ({
      buckets: {
        get: jest.fn(),
        insert: jest.fn(),
        delete: jest.fn(),
        getIamPolicy: jest.fn(),
        setIamPolicy: jest.fn(),
        list: jest.fn(),
      },
      objects: {
        list: jest.fn(),
        insert: jest.fn(),
        delete: jest.fn(),
      },
    })),
    auth: {
      OAuth2: jest.fn(() => ({
        setCredentials: jest.fn(),
      })),
    },
  },
}));

describe('GcpService - Storage', () => {
  let service: GcpService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    gcpConnection: {
      findUnique: jest.fn(),
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

    // Mock environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3000/auth/callback';
    process.env.ENCRYPTION_KEY = 'test-encryption-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setupStorage', () => {
    it('should create a new storage bucket when it does not exist', async () => {
      const userId = 'test-user-id';
      const projectId = 'test-project-id';
      const mockGcpConnection = {
        userId,
        accessToken: 'encrypted-access-token',
        refreshToken: 'encrypted-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        activeProjectId: projectId,
      };

      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(mockGcpConnection);

      // Mock the getValidAccessToken method
      jest.spyOn(service as any, 'getValidAccessToken').mockResolvedValue('valid-access-token');

      // Mock storage API calls
      const mockStorage = {
        buckets: {
          get: jest.fn().mockRejectedValue({ code: 404 }), // Bucket doesn't exist
          insert: jest.fn().mockResolvedValue({ data: { name: 'canary-assets-test-project-id' } }),
          list: jest.fn().mockResolvedValue({ data: { items: [] } }), // Authentication test
        },
        objects: {
          insert: jest.fn().mockResolvedValue({}),
        },
      };

      const mockGoogle = require('googleapis').google;
      mockGoogle.storage.mockReturnValue(mockStorage);

      const result = await service.setupStorage(userId, projectId);

      expect(result.success).toBe(true);
      expect(result.bucketName).toBe('canary-assets-test-project-id');
      expect(result.region).toBe('us-central1');
      expect(result.folders).toEqual(['stable/', 'canary/']);
      expect(result.bucketUrl).toBe('https://storage.googleapis.com/canary-assets-test-project-id');
      expect(result.message).toContain('created successfully');
    });

    it('should handle existing bucket and create folders', async () => {
      const userId = 'test-user-id';
      const projectId = 'test-project-id';
      const mockGcpConnection = {
        userId,
        accessToken: 'encrypted-access-token',
        refreshToken: 'encrypted-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        activeProjectId: projectId,
      };

      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(mockGcpConnection);

      // Mock the getValidAccessToken method
      jest.spyOn(service as any, 'getValidAccessToken').mockResolvedValue('valid-access-token');

      // Mock storage API calls
      const mockStorage = {
        buckets: {
          get: jest.fn().mockResolvedValue({ data: { name: 'canary-assets-test-project-id' } }), // Bucket exists
          list: jest.fn().mockResolvedValue({ data: { items: [] } }), // Authentication test
        },
        objects: {
          insert: jest.fn().mockResolvedValue({}),
        },
      };

      const mockGoogle = require('googleapis').google;
      mockGoogle.storage.mockReturnValue(mockStorage);

      const result = await service.setupStorage(userId, projectId);

      expect(result.success).toBe(true);
      expect(result.bucketName).toBe('canary-assets-test-project-id');
      expect(result.message).toContain('already exists');
    });

    it('should throw error when no GCP connection found', async () => {
      const userId = 'test-user-id';
      const projectId = 'test-project-id';

      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(null);

      await expect(service.setupStorage(userId, projectId)).rejects.toThrow(
        new HttpException('No GCP connection found', HttpStatus.NOT_FOUND)
      );
    });
  });

  describe('getStorageStatus', () => {
    it('should return bucket status when bucket exists', async () => {
      const userId = 'test-user-id';
      const projectId = 'test-project-id';
      const mockGcpConnection = {
        userId,
        accessToken: 'encrypted-access-token',
        refreshToken: 'encrypted-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        activeProjectId: projectId,
      };

      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(mockGcpConnection);

      // Mock the getValidAccessToken method
      jest.spyOn(service as any, 'getValidAccessToken').mockResolvedValue('valid-access-token');

      // Mock storage API calls
      const mockStorage = {
        buckets: {
          get: jest.fn().mockResolvedValue({ 
            data: { 
              name: 'canary-assets-test-project-id',
              location: 'us-central1'
            } 
          }),
        },
        objects: {
          list: jest.fn().mockResolvedValue({ data: { items: [{ name: 'stable/.keep' }] } }),
        },
      };

      const mockGoogle = require('googleapis').google;
      mockGoogle.storage.mockReturnValue(mockStorage);

      const result = await service.getStorageStatus(userId, projectId);

      expect(result.success).toBe(true);
      expect(result.bucketExists).toBe(true);
      expect(result.bucketName).toBe('canary-assets-test-project-id');
      expect(result.region).toBe('us-central1');
    });

    it('should return bucket not exists when bucket is not found', async () => {
      const userId = 'test-user-id';
      const projectId = 'test-project-id';
      const mockGcpConnection = {
        userId,
        accessToken: 'encrypted-access-token',
        refreshToken: 'encrypted-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        activeProjectId: projectId,
      };

      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(mockGcpConnection);

      // Mock the getValidAccessToken method
      jest.spyOn(service as any, 'getValidAccessToken').mockResolvedValue('valid-access-token');

      // Mock storage API calls
      const mockStorage = {
        buckets: {
          get: jest.fn().mockRejectedValue({ code: 404 }), // Bucket doesn't exist
        },
      };

      const mockGoogle = require('googleapis').google;
      mockGoogle.storage.mockReturnValue(mockStorage);

      const result = await service.getStorageStatus(userId, projectId);

      expect(result.success).toBe(true);
      expect(result.bucketExists).toBe(false);
      expect(result.message).toBe('Storage bucket does not exist');
    });
  });

  describe('cleanupStorage', () => {
    it('should delete bucket and all contents successfully', async () => {
      const userId = 'test-user-id';
      const projectId = 'test-project-id';
      const mockGcpConnection = {
        userId,
        accessToken: 'encrypted-access-token',
        refreshToken: 'encrypted-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        activeProjectId: projectId,
      };

      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(mockGcpConnection);

      // Mock the getValidAccessToken method
      jest.spyOn(service as any, 'getValidAccessToken').mockResolvedValue('valid-access-token');

      // Mock storage API calls
      const mockStorage = {
        objects: {
          list: jest.fn().mockResolvedValue({ 
            data: { 
              items: [
                { name: 'stable/.keep' },
                { name: 'canary/.keep' }
              ] 
            } 
          }),
          delete: jest.fn().mockResolvedValue({}),
        },
        buckets: {
          delete: jest.fn().mockResolvedValue({}),
        },
      };

      const mockGoogle = require('googleapis').google;
      mockGoogle.storage.mockReturnValue(mockStorage);

      const result = await service.cleanupStorage(userId, projectId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Storage bucket and all contents deleted successfully');
    });

    it('should handle bucket not found during cleanup', async () => {
      const userId = 'test-user-id';
      const projectId = 'test-project-id';
      const mockGcpConnection = {
        userId,
        accessToken: 'encrypted-access-token',
        refreshToken: 'encrypted-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        activeProjectId: projectId,
      };

      mockPrismaService.gcpConnection.findUnique.mockResolvedValue(mockGcpConnection);

      // Mock the getValidAccessToken method
      jest.spyOn(service as any, 'getValidAccessToken').mockResolvedValue('valid-access-token');

      // Mock storage API calls
      const mockStorage = {
        objects: {
          list: jest.fn().mockRejectedValue({ code: 404 }), // Bucket doesn't exist
        },
      };

      const mockGoogle = require('googleapis').google;
      mockGoogle.storage.mockReturnValue(mockStorage);

      const result = await service.cleanupStorage(userId, projectId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Storage bucket does not exist');
    });
  });
}); 