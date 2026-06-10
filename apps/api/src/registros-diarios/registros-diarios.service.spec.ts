import { Test, TestingModule } from '@nestjs/testing';
import { RegistrosDiariosService } from './registros-diarios.service';

describe('RegistrosDiariosService', () => {
  let service: RegistrosDiariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegistrosDiariosService],
    }).compile();

    service = module.get<RegistrosDiariosService>(RegistrosDiariosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
