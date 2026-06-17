import { Test, TestingModule } from '@nestjs/testing';
import { EstudanteService } from './estudante.service.js';

describe('EstudanteService', () => {
  let service: EstudanteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstudanteService,
        { provide: 'IEstudanteRepositorio', useValue: {} }
      ],
    }).compile();

    service = module.get<EstudanteService>(EstudanteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
