import { Test, TestingModule } from '@nestjs/testing';
import { TurmaController } from './turma.controller.js';
import { TurmaService } from './turma.service.js';

describe('TurmaController', () => {
  let controller: TurmaController;

  const mockTurmaService = {
    findAll: vi.fn(),
    findEstudantesByTurma: vi.fn(),
    obterDadosGraficos: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurmaController],
      providers: [
        { provide: TurmaService, useValue: mockTurmaService },
      ],
    }).compile();

    controller = module.get<TurmaController>(TurmaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
