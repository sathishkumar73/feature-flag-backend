import { Test, TestingModule } from '@nestjs/testing';
import { CorsService } from './cors.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CorsService', () => {
  let service: CorsService;
  const mockPrisma = {
    allowedOrigin: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CorsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<CorsService>(CorsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return allowed origins', async () => {
    mockPrisma.allowedOrigin.findMany.mockResolvedValue([
      { origin: 'https://foo.com' },
      { origin: 'https://bar.com' },
    ]);
    const result = await service.getAllowedOrigins();
    expect(result).toEqual(['https://foo.com', 'https://bar.com']);
  });
});
