import { Prisma, RegistroDiario } from '@prisma-client';

export type EstudanteParaGeracaoDiario = Prisma.EstudanteGetPayload<{
  include: {
    turmas: {
      select: { educadorId: true };
    };
  };
}>;

export interface IRegistroDiarioRepositorio {
  criar(
    dados: Prisma.RegistroDiarioUncheckedCreateInput,
  ): Promise<RegistroDiario>;
  buscarTodos(): Promise<RegistroDiario[]>;
  buscarAlertasDiasAnteriores(educadorId: string): Promise<RegistroDiario[]>;
  contarRegistrosPreenchidos(
    educadorId: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<number>;
  contarRegistrosEsperados(
    educadorId: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<number>;
  buscarPorId(id: string): Promise<RegistroDiario | null>;
  atualizar(
    id: string,
    dados: Prisma.RegistroDiarioUncheckedUpdateInput,
  ): Promise<RegistroDiario>;
  remover(id: string): Promise<RegistroDiario>;
  buscarEstudantesParaGeracaoAutomatica(): Promise<
    EstudanteParaGeracaoDiario[]
  >;
  criarVarios(
    registros: Prisma.RegistroDiarioCreateManyInput[],
  ): Promise<{ count: number }>;
  buscarPorPeriodo(
    estudanteId: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<RegistroDiario[]>;
  buscarPorEstudanteEData(
    estudanteId: string,
    data: Date,
  ): Promise<RegistroDiario | null>;
  buscarRegistrosPorPeriodo(
    estudanteId: string,
    dataLimite: Date,
  ): Promise<RegistroDiario[]>;
  buscarRegistrosPorIntervalo(
    estudanteId: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<RegistroDiario[]>;
}
