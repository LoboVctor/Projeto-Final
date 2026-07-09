import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  ITurmaRepositorio,
  TurmaLista,
  TurmaComEstudantes,
  TurmaParaGrafico,
  TurmaParaMetricas,
  AgregacaoKpisDiarios,
  FiltroKpisDiarios
} from './interfaces/ITurmaRepositorio.js';

@Injectable()
export class TurmaRepository implements ITurmaRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarTodas(educadorId?: string): Promise<TurmaLista[]> {
    return this.prisma.client.turma.findMany({
      where: educadorId ? { educadorId } : undefined,
      select: {
        id: true,
        nome: true,
        turno: true,
        anoLetivo: true,
        etapa: true,
        escola: { select: { id: true, nome: true } },
        _count: { select: { estudantes: true } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async buscarEstudantesPorTurma(
    turmaId: string,
  ): Promise<TurmaComEstudantes | null> {
    return this.prisma.client.turma.findUnique({
      where: { id: turmaId },
      include: {
        estudantes: {
          select: {
            id: true,
            nomeCompleto: true,
            foto: true,
            matricula: true,
            dataNascimento: true,
            turmas: {
              select: { id: true, nome: true },
            },
            diagnosticos: {
              select: {
                diagnostico: {
                  select: { id: true, nome: true, tipo: true },
                },
              },
            },
          },
          orderBy: { nomeCompleto: 'asc' },
        },
      },
    });
  }

  async buscarDadosGraficos(turmaId: string): Promise<{
    turma: TurmaParaGrafico | null;
    assiduidade: { presenca: boolean | null; _count: { presenca: number } }[];
  }> {
    const [turma, assiduidade] = await Promise.all([
      this.prisma.client.turma.findUnique({
        where: { id: turmaId },
        include: {
          estudantes: {
            include: {
              diagnosticos: {
                include: { diagnostico: true },
              },
            },
          },
        },
      }),
      this.prisma.client.registroAula.groupBy({
        by: ['presenca'],
        where: { aula: { turmaId: turmaId } },
        _count: { presenca: true },
      }),
    ]);

    return { turma, assiduidade };
  }

  /**
   * Busca todos os dados dos estudantes de uma turma necessários para
   * calcular Big Numbers e gráficos (sexo, idade, diagnóstico, comunicação).
   */
  async buscarMetricasTurma(turmaId: string): Promise<TurmaParaMetricas | null> {
    return this.prisma.client.turma.findUnique({
      where: { id: turmaId },
      include: {
        estudantes: {
          select: {
            id: true,
            dataNascimento: true,
            sexo: true,
            formaComunicacao: true,
            diagnosticos: {
              select: {
                diagnostico: {
                  select: { tipo: true },
                },
              },
            },
          },
        },
      },
    });
  }

  async buscarAgregacoesKpis(filtro?: FiltroKpisDiarios): Promise<AgregacaoKpisDiarios> {
    const whereCondition: Prisma.RegistroDiarioWhereInput = {};

    if (filtro?.turmaId) {
      whereCondition.estudante = { turmas: { some: { id: filtro.turmaId } } };
    } else if (filtro?.escolaId) {
      whereCondition.estudante = { turmas: { some: { escolaId: filtro.escolaId } } };
    }

    const diariosAgregados = await this.prisma.client.registroDiario.aggregate({
      where: whereCondition,
      _avg: {
        scoreComportamento: true,
        scoreInteracao: true,
        scoreFoco: true,
        scoreAutonomia: true,
        statusAlimentacao: true,
        usoBanheiro: true,
      },
    });

    return { diariosAgregados };
  }

  async buscarAgregacoesDiariasPorPeriodo(turmaId: string, inicio: Date, fim: Date) {
    return this.prisma.client.registroDiario.aggregate({
      where: {
        estudante: { turmas: { some: { id: turmaId } } },
        data: { gte: inicio, lte: fim },
        preenchido: true,
      },
      _avg: {
        scoreComportamento: true,
        scoreInteracao: true,
        scoreFoco: true,
        scoreAutonomia: true,
        statusAlimentacao: true,
        usoBanheiro: true,
      },
    });
  }

  async buscarFrequenciaPorPeriodo(turmaId: string, inicio: Date, fim: Date) {
    return this.prisma.client.registroAula.groupBy({
      by: ['presenca'],
      where: {
        data: { gte: inicio, lte: fim },
        
        aula: {
          turmaId: turmaId,
        },
      },
      _count: { presenca: true },
    });
  }

  async buscarAulasRealizadas(turmaId: string, inicio: Date, fim: Date) {
    return this.prisma.client.registroAula.findMany({
      where: {
        aula: { turmaId: turmaId },
        data: { gte: inicio, lte: fim },
        status_aula: 'REALIZADA' 
      },
      select: { presenca: true }
    });
  }

  async contarEstudantesDoEducador(educadorId: string): Promise<number> {
    return this.prisma.client.estudante.count({
      where: {
        turmas: {
          some: { educadorId: educadorId }
        }
      }
    });
  }
  async buscarRegistrosDiariosDoEducador(educadorId: string, dataCorte?: Date) {
    const whereCondition: any = { 
      educadorId: educadorId,
      preenchido: true 
    };

    if (dataCorte) {
      whereCondition.data = { gte: dataCorte };
    }

    return this.prisma.client.registroDiario.findMany({
      where: whereCondition,
      select: {
        data: true,
        scoreComportamento: true,
        scoreInteracao: true,
        scoreFoco: true,
        scoreAutonomia: true,
        statusAlimentacao: true,
        usoBanheiro: true
      }
    });
  }
}
