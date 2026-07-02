import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  IRegistroDiarioRepositorio,
  EstudanteParaGeracaoDiario,
} from './interfaces/IRegistroDiarioRepositorio.js';
import { Prisma, RegistroDiario } from '@prisma-client';

@Injectable()
export class RegistroDiarioRepository implements IRegistroDiarioRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async criar(
    dados: Prisma.RegistroDiarioUncheckedCreateInput,
  ): Promise<RegistroDiario> {
    return this.prisma.client.registroDiario.create({ data: dados });
  }

  async buscarTodos(): Promise<RegistroDiario[]> {
    return this.prisma.client.registroDiario.findMany({
      include: { estudante: true, educador: true },
      orderBy: { data: 'desc' },
    });
  }

  async buscarAlertasDiasAnteriores(
    educadorId: string,
  ): Promise<RegistroDiario[]> {
    const inicioDoDiaAtual = new Date();
    inicioDoDiaAtual.setHours(0, 0, 0, 0);

    return this.prisma.client.registroDiario.findMany({
      where: {
        data: { lt: inicioDoDiaAtual },
        preenchido: false,
        educadorId: educadorId,
      },
      include: { estudante: true },
      orderBy: { data: 'desc' },
    });
  }

  async contarRegistrosPreenchidos(
    educadorId: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<number> {
    return this.prisma.client.registroDiario.count({
      where: {
        educadorId: educadorId,
        data: { gte: dataInicio, lte: dataFim },
        preenchido: true,
      },
    });
  }

  async contarRegistrosEsperados(
    educadorId: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<number> {
    return this.prisma.client.registroDiario.count({
      where: {
        educadorId: educadorId,
        data: { gte: dataInicio, lte: dataFim },
      },
    });
  }

  async buscarPorId(id: string): Promise<RegistroDiario | null> {
    return this.prisma.client.registroDiario.findUnique({
      where: { id },
      include: { estudante: true, educador: true },
    });
  }

  async atualizar(
    id: string,
    dados: Prisma.RegistroDiarioUncheckedUpdateInput,
  ): Promise<RegistroDiario> {
    return this.prisma.client.registroDiario.update({
      where: { id },
      data: dados,
    });
  }

  async remover(id: string): Promise<RegistroDiario> {
    return this.prisma.client.registroDiario.delete({
      where: { id },
    });
  }

  async buscarEstudantesParaGeracaoAutomatica(): Promise<
    EstudanteParaGeracaoDiario[]
  > {
    return this.prisma.client.estudante.findMany({
      where: { statusMatricula: true },
      include: {
        turmas: {
          where: { tipo: 'REGENCIA' },
          select: { educadorId: true },
        },
      },
    });
  }

  async criarVarios(
    registros: Prisma.RegistroDiarioCreateManyInput[],
  ): Promise<{ count: number }> {
    return this.prisma.client.registroDiario.createMany({
      data: registros,
      skipDuplicates: true,
    });
  }

  async buscarPorPeriodo(
    estudanteId: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<RegistroDiario[]> {
  async buscarPorPeriodo(estudanteId: string, dataInicio: Date, dataFim: Date): Promise<RegistroDiario[]> {
    const inicio = new Date(dataInicio);
    inicio.setUTCHours(0, 0, 0, 0);
    
    const fim = new Date(dataFim);
    fim.setUTCHours(23, 59, 59, 999);

    return this.prisma.client.registroDiario.findMany({
      where: {
        estudanteId,
        data: { gte: inicio, lte: fim },
      },
      orderBy: { data: 'asc' },
    });
  }

  async buscarPorEstudanteEData(
    estudanteId: string,
    data: Date,
  ): Promise<RegistroDiario | null> {
    const inicio = new Date(data);
    inicio.setUTCHours(0, 0, 0, 0);
    const fim = new Date(data);
    fim.setUTCHours(23, 59, 59, 999);

    return this.prisma.client.registroDiario.findFirst({
      where: {
        estudanteId,
        data: { gte: inicio, lte: fim },
      },
    });
  }

  async buscarRegistrosPorPeriodo(
    estudanteId: string,
    dataLimite: Date,
  ): Promise<RegistroDiario[]> {
    return this.prisma.client.registroDiario.findMany({
      where: {
        estudanteId: estudanteId,
        data: {
          gte: dataLimite,
        },
        preenchido: true,
      },
      orderBy: {
        data: 'asc',
      },
    });
  }

  async buscarRegistrosPorIntervalo(
    estudanteId: string,
    dataInicio: Date,
    dataFim: Date,
  ): Promise<RegistroDiario[]> {
  async buscarRegistrosPorIntervalo(estudanteId: string, dataInicio: Date, dataFim: Date): Promise<RegistroDiario[]> {
    const inicio = new Date(dataInicio);
    inicio.setUTCHours(0, 0, 0, 0);
    
    const fim = new Date(dataFim);
    fim.setUTCHours(23, 59, 59, 999);

    return this.prisma.client.registroDiario.findMany({
      where: {
        estudanteId: estudanteId,
        data: {
          gte: inicio,
          lte: fim,
        },
        preenchido: true,
      },
    });
  }
}
