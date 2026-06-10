import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TurmasService {
  private readonly logger = new Logger(TurmasService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista as turmas cujo educador possui pelo menos uma Aula associada.
   * Se educadorId não for fornecido, retorna todas as turmas.
   */
  async findAll(educadorId?: string) {
    return this.prisma.client.turma.findMany({
      where: educadorId
        ? {
            OR: [
              { educadorId: educadorId },
              { aulas: { some: { educadorId } } }
            ]
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

  /**
   * Lista os estudantes de uma turma com dados básicos e seus diagnósticos.
   * Usa include único para buscar a turma e seus estudantes em uma única chamada ao BD, evitando N+1.
   */
  async findEstudantesByTurma(turmaId: string) {
    const turma = await this.prisma.client.turma.findUnique({
      where: { id: turmaId },
      include: {
        estudantes: {
          select: {
            id: true,
            nomeCompleto: true,
            foto: true,
            matricula: true,
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

    if (!turma) {
      throw new NotFoundException(`Turma com id "${turmaId}" não encontrada.`);
    }

    return {
      turma: { id: turma.id, nome: turma.nome },
      estudantes: turma.estudantes
    };
  }

  /**
   * Retorna os dados para os gráficos de diagnósticos e assiduidade de uma turma.
   * As consultas ao banco são executadas concorrentemente com Promise.all para melhorar o desempenho.
   */
  async obterDadosGraficos(turmaId: string) {
    try {
      const [turma, assiduidade] = await Promise.all([
        this.prisma.client.turma.findUnique({
          where: { id: turmaId },
          include: {
            estudantes: {
              include: {
                diagnosticos: {
                  include: { diagnostico: true }
                }
              }
            }
          }
        }),
        this.prisma.client.registroAula.groupBy({
          by: ['presenca'],
          where: { aula: { turmaId: turmaId } },
          _count: { presenca: true },
        })
      ]);

      if (!turma) {
        throw new NotFoundException('Turma não encontrada');
      }

      const contagemDiagnosticos: Record<string, number> = {};
      
      turma.estudantes.forEach(estudante => {
        estudante.diagnosticos.forEach(ed => {
          const tipo = ed.diagnostico.tipo; 
          contagemDiagnosticos[tipo] = (contagemDiagnosticos[tipo] || 0) + 1;
        });
      });

      const formatacaoDiagnosticos = Object.entries(contagemDiagnosticos)
        .map(([tipo, quantidade]) => ({ tipo, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);

      const presentes = assiduidade.find(a => a.presenca === true)?._count.presenca || 0;
      const ausentes = assiduidade.find(a => a.presenca === false)?._count.presenca || 0;

      return {
        diagnosticos: formatacaoDiagnosticos,
        assiduidade: { presentes, ausentes }
      };
    } catch (error) {
      this.logger.error(`Erro ao processar gráficos da turma ${turmaId}`, error);
      throw error;
    }
  }
}
