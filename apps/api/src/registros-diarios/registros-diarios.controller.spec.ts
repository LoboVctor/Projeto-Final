import { Test, TestingModule } from '@nestjs/testing';
import { RegistrosDiariosController } from './registros-diarios.controller';
import { RegistrosDiariosService } from './registros-diarios.service';

describe('RegistrosDiariosController', () => {
  let controller: RegistrosDiariosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrosDiariosController],
      providers: [RegistrosDiariosService],
    }).compile();

    controller = module.get<RegistrosDiariosController>(RegistrosDiariosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
