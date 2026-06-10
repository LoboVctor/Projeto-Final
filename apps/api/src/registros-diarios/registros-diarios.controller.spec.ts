import { Test, TestingModule } from '@nestjs/testing';
import { RegistrosDiariosController } from './registros-diarios.controller';
import { RegistrosDiariosService } from './registros-diarios.service';

import { PrismaService } from '../prisma/prisma.service';

describe('RegistrosDiariosController', () => {
  let controller: RegistrosDiariosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrosDiariosController],
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

    controller = module.get<RegistrosDiariosController>(RegistrosDiariosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
