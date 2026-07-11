import { Prisma } from '@prisma-client';

export type TurmaLista = Prisma.TurmaGetPayload<{
  select: {
    id: true;
    nome: true;
    turno: true;
    anoLetivo: true;
    etapa: true;
    escola: { select: { id: true; nome: true } };
    _count: { select: { estudantes: true } };
  };
}>;

export type TurmaComEstudantes = Prisma.TurmaGetPayload<{
  include: {
    estudantes: {
      select: {
        id: true;
        nomeCompleto: true;
        foto: true;
        matricula: true;
        dataNascimento: true;
        diagnosticos: {
          select: {
            diagnostico: {
              select: { id: true; nome: true; tipo: true };
            };
          };
        };
      };
    };
  };
}>;

export type TurmaParaGrafico = Prisma.TurmaGetPayload<{
  include: {
    estudantes: {
      include: {
        diagnosticos: {
          include: { diagnostico: true };
        };
      };
    };
  };
}>;

/** Tipo para o cálculo de métricas da turma (Big Numbers + Gráficos) */
export type TurmaParaMetricas = Prisma.TurmaGetPayload<{
  include: {
    estudantes: {
      select: {
        id: true;
        dataNascimento: true;
        sexo: true;
        formaComunicacao: true;
        diagnosticos: {
          select: {
            diagnostico: {
              select: { tipo: true };
            };
          };
        };
      };
    };
  };
}>;

/** Resultado do endpoint GET /turmas/:id/metricas */
export interface MetricasTurma {
  totalAlunos: number;
  idadePredominante: number | null;
  diagnosticoPrincipal: string | null;
  comunicacaoPrincipal: string | null;
  distribuicaoSexo: { sexo: string; quantidade: number }[];
  distribuicaoIdade: { idade: number; quantidade: number }[];
  distribuicaoDiagnostico: { tipo: string; quantidade: number }[];
  distribuicaoComunicacao: { forma: string; quantidade: number }[];
}

export interface FiltroKpisDiarios {
  turmaId?: string;
  escolaId?: string;
}

export interface AgregacaoKpisDiarios {
  diariosAgregados: {
    _avg: {
      scoreComportamento: number | null;
      scoreInteracao: number | null;
      scoreFoco: number | null;
      scoreAutonomia: number | null;
      statusAlimentacao: number | null;
      usoBanheiro: number | null;
    };
  };
}

export interface ITurmaRepositorio {
  buscarTodas(educadorId?: string): Promise<TurmaLista[]>;
  buscarEstudantesPorTurma(turmaId: string): Promise<TurmaComEstudantes | null>;
  buscarDadosGraficos(turmaId: string): Promise<{
    turma: TurmaParaGrafico | null;
    assiduidade: { presenca: boolean | null; _count: { presenca: number } }[];
  }>;
  buscarMetricasTurma(turmaId: string): Promise<TurmaParaMetricas | null>;
  buscarMetricasEscola(): Promise<{
    estudantes: {
      id: string;
      dataNascimento: Date;
      sexo: string;
      formaComunicacao: string;
      diagnosticos: { diagnostico: { tipo: string } }[];
    }[];
    totalProfessores: number;
    totalTurmas: number;
  }>;
  
  criarTurma(dados: any): Promise<any>;

  // NOVO MÉTODO
  buscarAgregacoesKpis(filtro?: FiltroKpisDiarios): Promise<AgregacaoKpisDiarios>;

  buscarAgregacoesDiariasPorPeriodo(turmaId: string, inicio: Date, fim: Date): Promise<any>;
  buscarFrequenciaPorPeriodo(turmaId: string, inicio: Date, fim: Date): Promise<any>;
  buscarAulasRealizadas(turmaId: string, inicio: Date, fim: Date): Promise<{ presenca: boolean }[]>;
  contarEstudantesDoEducador(educadorId: string): Promise<number>;
  buscarRegistrosDiariosDoEducador(
    educadorId: string, 
    dataCorte?: Date
  ): Promise<{
    data: Date;
    scoreComportamento: number;
    scoreInteracao: number;
    scoreFoco: number;
    scoreAutonomia: number;
    statusAlimentacao: number;
    usoBanheiro: number;
  }[]>;
}
