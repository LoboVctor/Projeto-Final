import { Test, TestingModule } from '@nestjs/testing';
import { RegistroDiarioService } from './registro-diario.service.js';

describe('RegistroDiarioService', () => {
  let service: RegistroDiarioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistroDiarioService,
        { provide: 'IRegistroDiarioRepositorio', useValue: {} },
      ],
    }).compile();

    service = module.get<RegistroDiarioService>(RegistroDiarioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
