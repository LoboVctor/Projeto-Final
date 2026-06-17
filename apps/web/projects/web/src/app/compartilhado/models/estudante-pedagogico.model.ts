export type StatusRelatorio = 'RASCUNHO' | 'EM_REVISAO' | 'CONCLUIDO';
export type Semestre      = 'PRIMEIRO' | 'SEGUNDO';
export type Bimestre      = 'PRIMEIRO' | 'SEGUNDO';
export type Eixo          = 'COGNITIVO' | 'MOTOR' | 'LINGUAGEM' | 'SOCIOEMOCIONAL' | 'AUTONOMIA';

export interface PibiResumo {
  id: string;
  bimestre: Bimestre;
  status: StatusRelatorio;
  scoreAtingibilidade: number;
  parecerEvolutivo: string;
  criadoEm: string;
}

export interface MetaDesenvolvimento {
  id: string;
  descricao: string;
  eixoDesenvolvimento: Eixo;
  scoreFinal: number;
  parecer: string;
  pibis: PibiResumo[];
}

export interface RelatorioSemestral {
  id: string;
  semestre: Semestre;
  ano: number;
  parecerGlobalDesenvolvimento: string;
  status: StatusRelatorio;
  dataFechamento: string;
  metas: MetaDesenvolvimento[];
}

export interface EstudantePedagogico {
  estudanteId: string;
  nomeCompleto: string;
  relatorios: RelatorioSemestral[];
}
