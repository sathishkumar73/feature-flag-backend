import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyService } from './api-key.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

const mockPrisma = {
  apiKey: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
  },
};

describe('ApiKeyService', () => {
  let service: ApiKeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ApiKeyService>(ApiKeyService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAndStoreApiKey', () => {
    it('should create and return a new API key', async () => {
      mockPrisma.apiKey.create.mockResolvedValue({});
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed');
      const result = await service.generateAndStoreApiKey('user1');
      expect(result.apiKeyPlain).toBeDefined();
      expect(mockPrisma.apiKey.create).toHaveBeenCalled();
    });
  });
});
