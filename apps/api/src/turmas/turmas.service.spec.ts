import { Test, TestingModule } from '@nestjs/testing';
import { TurmasService } from './turmas.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('TurmasService', () => {
  let service: TurmasService;

  const mockPrismaService = {
    client: {
      turma: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      registroAula: {
        groupBy: jest.fn(),
      },
      estudante: {
        findMany: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurmasService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TurmasService>(TurmasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
