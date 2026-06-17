import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IEstudanteRepositorio, EstudanteVisaoGeral, EstudanteSaude, EstudantePedagogico } from './interfaces/IEstudanteRepositorio.js';
import { Especificidade, EstudanteEspecificidade, TipoEspecificidade, CategoriaEspecificidade } from '@prisma-client';

@Injectable()
export class EstudanteRepository implements IEstudanteRepositorio {
  constructor(private prisma: PrismaService) {}

  async buscarVisaoGeral(estudanteId: string): Promise<EstudanteVisaoGeral | null> {
    return this.prisma.client.estudante.findUnique({
      where: { id: estudanteId },
      include: {
        turmas: {
          include: { educador: true },
        },
        responsaveis: {
          where: { responsavelPrincipal: true },
          include: { responsavel: true },
        },
        especificidades: {
          include: { especificidade: true },
        },
      },
    });
  }

  async buscarSaude(estudanteId: string): Promise<EstudanteSaude | null> {
    return this.prisma.client.estudante.findUnique({
      where: { id: estudanteId },
      select: {
        id: true,
        nomeCompleto: true,
        especificidades: {
          select: {
            especificidadeId: true,
            obsReacao: true,
            especificidade: {
              select: {
                descricao: true,
                categoria: true,
                tipo: true,
              },
            },
          },
        },
        diagnosticos: {
          select: {
            diagnostico: { select: { nome: true } },
            documentos: {
              select: {
                id: true,
                tipo: true,
                arquivo: true,
                dataEmissao: true,
              },
            },
          },
        },
        medicamentos: {
          select: {
            dosagem: true,
            unidadeMedida: true,
            horarioAdministrado: true,
            administradoEscola: true,
            medicamento: { select: { nome: true } },
          },
        },
      },
    });
  }

  async buscarPedagogico(estudanteId: string): Promise<EstudantePedagogico | null> {
    return this.prisma.client.estudante.findUnique({
      where: { id: estudanteId },
      select: {
        id: true,
        nomeCompleto: true,
        relatoriosSemestrais: {
          orderBy: [{ ano: 'desc' }, { semestre: 'desc' }],
          select: {
            id: true,
            semestre: true,
            ano: true,
            parecerGlobalDesenvolvimento: true,
            status: true,
            dataFechamento: true,
            metas: {
              orderBy: { eixoDesenvolvimento: 'asc' },
              select: {
                id: true,
                descricao: true,
                eixoDesenvolvimento: true,
                scoreFinal: true,
                parecer: true,
                pibis: {
                  orderBy: { bimestre: 'asc' },
                  select: {
                    id: true,
                    bimestre: true,
                    status: true,
                    scoreAtingibilidade: true,
                    parecerEvolutivo: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async buscarEspecificidadeExata(tipo: TipoEspecificidade, categoria: CategoriaEspecificidade, descricao: string): Promise<Especificidade | null> {
    return this.prisma.client.especificidade.findFirst({
      where: {
        tipo,
        categoria,
        descricao: { equals: descricao, mode: 'insensitive' },
      },
    });
  }

  async criarEspecificidade(dados: { tipo: TipoEspecificidade; categoria: CategoriaEspecificidade; descricao: string }): Promise<Especificidade> {
    return this.prisma.client.especificidade.create({
      data: dados,
    });
  }

  async buscarVinculoEspecificidade(estudanteId: string, especificidadeId: number): Promise<EstudanteEspecificidade | null> {
    return this.prisma.client.estudanteEspecificidade.findUnique({
      where: { estudanteId_especificidadeId: { estudanteId, especificidadeId } },
    });
  }

  async criarVinculoEspecificidade(estudanteId: string, especificidadeId: number, obsReacao: string): Promise<EstudanteEspecificidade> {
    return this.prisma.client.estudanteEspecificidade.create({
      data: {
        estudanteId,
        especificidadeId,
        obsReacao,
      },
    });
  }

  async atualizarVinculoEspecificidade(estudanteId: string, especificidadeId: number, obsReacao: string): Promise<EstudanteEspecificidade> {
    return this.prisma.client.estudanteEspecificidade.update({
      where: { estudanteId_especificidadeId: { estudanteId, especificidadeId } },
      data: { obsReacao },
    });
  }

  async atualizarReferenciaVinculoEspecificidade(estudanteId: string, especificidadeIdAntiga: number, especificidadeIdNova: number, obsReacao: string): Promise<EstudanteEspecificidade> {
    await this.prisma.client.estudanteEspecificidade.delete({
      where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: especificidadeIdAntiga } },
    });
    return this.prisma.client.estudanteEspecificidade.update({
      where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: especificidadeIdNova } },
      data: { obsReacao },
    });
  }

  async removerVinculoEspecificidade(estudanteId: string, especificidadeId: number): Promise<EstudanteEspecificidade> {
    return this.prisma.client.estudanteEspecificidade.delete({
      where: {
        estudanteId_especificidadeId: { estudanteId, especificidadeId },
      },
    });
  }

  async contarVinculosEspecificidade(especificidadeId: number): Promise<number> {
    return this.prisma.client.estudanteEspecificidade.count({
      where: { especificidadeId },
    });
  }

  async removerEspecificidade(especificidadeId: number): Promise<void> {
    await this.prisma.client.especificidade.delete({
      where: { id: especificidadeId },
    });
  }
}
