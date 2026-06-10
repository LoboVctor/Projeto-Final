import { Test, TestingModule } from '@nestjs/testing';
import { RegistrosDiariosService } from './registros-diarios.service';

import { PrismaService } from '../prisma/prisma.service';

describe('RegistrosDiariosService', () => {
  let service: RegistrosDiariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrosDiariosService,
        {
          provide: PrismaService,
          useValue: {
            client: {
              registroDiario: {
                findMany: jest.fn(),
                create: jest.fn(),
              },
            },
          },
        },
      ],
    }).compile();

    service = module.get<RegistrosDiariosService>(RegistrosDiariosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
