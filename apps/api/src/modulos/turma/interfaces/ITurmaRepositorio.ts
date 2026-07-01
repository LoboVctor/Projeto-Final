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

export interface ITurmaRepositorio {
  buscarTodas(educadorId?: string): Promise<TurmaLista[]>;
  buscarEstudantesPorTurma(turmaId: string): Promise<TurmaComEstudantes | null>;
  buscarDadosGraficos(turmaId: string): Promise<{
    turma: TurmaParaGrafico | null;
    assiduidade: { presenca: boolean | null; _count: { presenca: number } }[];
  }>;
}
