import { Test, TestingModule } from '@nestjs/testing';
import { EstudantesController } from './estudantes.controller';

describe('EstudantesController', () => {
  let controller: EstudantesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EstudantesController],
    }).compile();

    controller = module.get<EstudantesController>(EstudantesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
