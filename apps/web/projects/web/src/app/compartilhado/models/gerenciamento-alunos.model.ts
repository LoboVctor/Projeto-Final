/** Representa um estudante na listagem da Tela 4 (Gerenciamento Geral de Alunos). */
export interface EstudanteListagemItem {
  id: string;
  nomeCompleto: string;
  matricula: string;           // String no schema Prisma
  foto: string | null;
  statusMatricula: boolean;    // Boolean no schema Prisma
  dataNascimento: string;      // ISO date string
  sexo: 'MASCULINO' | 'FEMININO' | 'OUTRO';
  formaComunicacao: 'VERBAL' | 'NAO_VERBAL';
  turmas: { id: string; nome: string }[];
  diagnosticos: { diagnostico: { nome: string; tipo: string } }[];
}

/** Query params enviados para GET /estudantes */
export interface BuscaEstudantesParams {
  nome?: string;
  matricula?: string;
  diagnosticoTipo?: string;
  sexo?: string;
  turmaId?: string;
  formaComunicacao?: string;
  categoriaEspecificidade?: string;
  idadeMin?: number;
  idadeMax?: number;
  page?: number;
  limit?: number;
}

/** Wrapper de resposta paginada retornado pela API */
export interface PaginacaoResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPaginas: number;
}

/** Payload enviado para POST /estudo-de-caso */
export interface EstudoCasoPayload {
  estudanteId: string;
  dataReuniao: string;
  parecerDecisao: string;
  educadoresIds: string[];
}

/** Resposta retornada pela API após criar um Estudo de Caso */
export interface EstudoCasoResponse {
  id: string;
  estudante: { id: string; nomeCompleto: string };
  dataReuniao: string;
  parecerDecisao: string;
  educadores: { id: string; nome: string }[];
}

/**
 * Representa um educador na lista de participantes do Estudo de Caso.
 * MOCK: Esta interface será alimentada pela API de educadores (Sprint 5 / Dev B)
 * assim que o endpoint GET /educadores for implementado.
 */
export interface EducadorResumo {
  id: string;
  nome: string;
}
