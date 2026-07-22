import { Test, TestingModule } from '@nestjs/testing';
import { EstudantesController } from './estudante.controller.js';
import { EstudanteService } from './estudante.service.js';

describe('EstudanteController', () => {
  let controller: EstudantesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstudantesController],
      providers: [{ provide: EstudanteService, useValue: {} }]
    }).compile();

    controller = module.get<EstudantesController>(EstudantesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
