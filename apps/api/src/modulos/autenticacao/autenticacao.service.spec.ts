import { Test, TestingModule } from '@nestjs/testing';
import { AutenticacaoService } from './autenticacao.service.js';
import { UsuarioService } from '../usuario/usuario.service.js';
import { JwtService } from '@nestjs/jwt';

describe('AutenticacaoService', () => {
  let service: AutenticacaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutenticacaoService,
        {
          provide: UsuarioService,
          useValue: {},
        },
        {
          provide: JwtService,
          useValue: {},
        },
        {
          provide: 'IAutenticacaoRepositorio',
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AutenticacaoService>(AutenticacaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
