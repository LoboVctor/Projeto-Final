import type { CriarResponsavelDto } from '../dtos/criar-responsavel.dto.js';

export interface ResponsavelCriado {
  id: string;
  cpf: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
}

export interface IResponsavelRepositorio {
  criar(dados: CriarResponsavelDto, hashSenha: string): Promise<ResponsavelCriado>;
  buscarPorId(id: string): Promise<unknown | null>;
}
