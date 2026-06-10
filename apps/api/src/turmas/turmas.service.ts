import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TurmasService {
  private readonly logger = new Logger(TurmasService.name);

  constructor(private readonly prisma: PrismaService) {}

  async obterDadosGraficos(turmaId: string) {
    try {
      const turma = await this.prisma.client.turma.findUnique({
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
      });

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

      const assiduidade = await this.prisma.client.registroAula.groupBy({
        by: ['presenca'],
        where: { aula: { turmaId: turmaId } },
        _count: { presenca: true },
      });

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