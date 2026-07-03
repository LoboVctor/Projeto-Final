import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  ITurmaRepositorio,
  TurmaLista,
  TurmaComEstudantes,
  TurmaParaGrafico,
  TurmaParaMetricas
} from './interfaces/ITurmaRepositorio.js';

@Injectable()
export class TurmaRepository implements ITurmaRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarTodas(educadorId?: string): Promise<TurmaLista[]> {
    return this.prisma.client.turma.findMany({
      where: educadorId
        ? {
            OR: [
              { educadorId: educadorId },
              { aulas: { some: { educadorId } } },
            ],
          }
        : undefined,
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
}
