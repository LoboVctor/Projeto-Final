import { Test, TestingModule } from '@nestjs/testing';
import { TurmasController } from './turmas.controller.js';
import { TurmasService } from './turmas.service.js';

describe('TurmasController', () => {
  let controller: TurmasController;

  const mockTurmasService = {
    findAll: jest.fn(),
    findEstudantesByTurma: jest.fn(),
    obterDadosGraficos: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurmasController],
      providers: [
        { provide: TurmasService, useValue: mockTurmasService },
      ],
    }).compile();

    controller = module.get<TurmasController>(TurmasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
