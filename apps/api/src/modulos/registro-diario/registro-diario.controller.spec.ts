import { Test, TestingModule } from '@nestjs/testing';
import { RegistroDiarioController } from './registro-diario.controller.js';
import { RegistroDiarioService } from './registro-diario.service.js';

describe('RegistroDiarioController', () => {
  let controller: RegistroDiarioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistroDiarioController],
      providers: [
        { provide: RegistroDiarioService, useValue: {} },
      ],
    }).compile();

    controller = module.get<RegistroDiarioController>(RegistroDiarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
