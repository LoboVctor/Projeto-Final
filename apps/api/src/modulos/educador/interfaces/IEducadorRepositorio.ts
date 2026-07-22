import { Escola, TipoEducador } from '@prisma-client';

export interface FiltrosEducador {
  nome?: string;
  matricula?: string;
  tipo?: TipoEducador;
  /** 'ativos' | 'inativos' | 'todos' */
  status?: string;
  page: number;
  limit: number;
}

export interface AtualizarEducadorDados {
  nome?: string;
  cpf?: string;
  telefone?: string;
  tipo?: TipoEducador;
  dataContratacao?: string;
  turmaIds?: string[];
}

export interface CriarEducadorDados {
  nome: string;
  matricula: string;
  cpf: string;
  email: string;
  telefone: string;
  tipo: TipoEducador;
  dataContratacao: string;
  turmaIds?: string[];
}

export interface IEducadorRepositorio {
  buscarEscolaPadrao(): Promise<Escola | null>;
  listar(filtros: FiltrosEducador): Promise<{ data: unknown[]; total: number; totalPaginas: number }>;
  buscarPorId(id: string): Promise<unknown | null>;
  criar(dados: CriarEducadorDados, escolaId: string, hashSenha: string): Promise<unknown>;
  atualizar(id: string, dados: AtualizarEducadorDados): Promise<unknown>;
  desativar(id: string): Promise<void>;
  reativar(id: string): Promise<void>;
}
