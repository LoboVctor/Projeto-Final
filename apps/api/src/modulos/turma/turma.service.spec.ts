import { Test, TestingModule } from '@nestjs/testing';
import { TurmaService } from './turma.service.js';

describe('TurmaService', () => {
  let service: TurmaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurmaService,
        { provide: 'ITurmaRepositorio', useValue: {} },
      ],
    }).compile();

    service = module.get<TurmaService>(TurmaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
