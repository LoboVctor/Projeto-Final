import { Test, TestingModule } from '@nestjs/testing';
import { EstudanteController } from './estudante.controller.js';
import { EstudanteService } from './estudante.service.js';

describe('EstudanteController', () => {
  let controller: EstudanteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstudanteController],
      providers: [{ provide: EstudanteService, useValue: {} }]
    }).compile();

    controller = module.get<EstudanteController>(EstudanteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
