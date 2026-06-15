import { Test, TestingModule } from '@nestjs/testing';
import { EstudantesService } from './estudantes.service';

describe('EstudantesService', () => {
  let service: EstudantesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EstudantesService],
    }).compile();

    service = module.get<EstudantesService>(EstudantesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
