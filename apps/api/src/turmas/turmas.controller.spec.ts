import { Test, TestingModule } from '@nestjs/testing';
import { TurmasController } from './turmas.controller';

describe('TurmasController', () => {
  let controller: TurmasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurmasController],
    }).compile();

    controller = module.get<TurmasController>(TurmasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
