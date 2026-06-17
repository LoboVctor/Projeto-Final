import { PrismaService } from './prisma.service.js';
import { ConfigService } from '@nestjs/config';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    const configService = { getOrThrow: () => 'postgresql://fake:fake@fake:5432/fake' } as unknown as ConfigService;
    service = new PrismaService(configService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
