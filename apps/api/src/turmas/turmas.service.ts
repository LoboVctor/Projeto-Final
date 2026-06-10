import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class TurmasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lista as turmas cujo educador possui pelo menos uma Aula associada.
   * Se educadorId não for fornecido, retorna todas as turmas.
   */
  async findAll(educadorId?: string) {
    return this.prisma.client.turma.findMany({
      where: educadorId
        ? { aulas: { some: { educadorId } } }
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
   * Usa include único para evitar o problema N+1.
   */
  async findEstudantesByTurma(turmaId: string) {
    // Verifica se a turma existe antes de buscar estudantes
    const turma = await this.prisma.client.turma.findUnique({
      where: { id: turmaId },
      select: { id: true, nome: true },
    });

    if (!turma) {
      throw new NotFoundException(`Turma com id "${turmaId}" não encontrada.`);
    }

    const estudantes = await this.prisma.client.estudante.findMany({
      where: { turmas: { some: { id: turmaId } } },
      select: {
        id: true,
        nomeCompleto: true,
        foto: true,
        matricula: true,
        // Join com ESTUDANTE_DIAGNOSTICO → DIAGNOSTICO em uma única query
        diagnosticos: {
          select: {
            diagnostico: {
              select: { id: true, nome: true, tipo: true },
            },
          },
        },
      },
      orderBy: { nomeCompleto: 'asc' },
    });

    return { turma, estudantes };
  }
}
