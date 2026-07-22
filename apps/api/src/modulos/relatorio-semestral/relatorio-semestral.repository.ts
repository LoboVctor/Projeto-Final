import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Semestre } from '@prisma-client';
import type {
  IRelatorioSemestralRepositorio,
  RelatorioComMetas,
  RelatorioComMetasEPibis,
  DadosMeta,
} from './interfaces/IRelatorioSemestralRepositorio.js';

@Injectable()
export class RelatorioSemestralRepository implements IRelatorioSemestralRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarEstudantePorId(estudanteId: string) {
    return this.prisma.client.estudante.findUnique({ where: { id: estudanteId } });
  }

  async buscarRelatorioComMetas(
    estudanteId: string,
    ano: number,
    semestre: Semestre,
  ): Promise<RelatorioComMetas | null> {
    return this.prisma.client.relatorioSemestral.findFirst({
      where: { estudanteId, ano, semestre },
      include: { metas: true },
    });
  }

  async criarRelatorioEMetas(
    estudanteId: string,
    ano: number,
    semestre: Semestre,
    metas: DadosMeta[],
  ): Promise<RelatorioComMetas> {
    return this.prisma.client.$transaction(async (tx) => {
      const relatorio = await tx.relatorioSemestral.create({
        data: {
          estudanteId,
          ano,
          semestre,
          status: 'RASCUNHO',
          parecerGlobalDesenvolvimento: '',
          dataFechamento: new Date(),
        },
      });

      const metasCriadas = await Promise.all(
        metas.map((metaDto) =>
          tx.metaDesenvolvimento.create({
            data: {
              relatorioSemestralId: relatorio.id,
              eixoDesenvolvimento: metaDto.eixoDesenvolvimento,
              descricao: metaDto.descricao,
              scoreFinal: metaDto.scoreFinal,
              parecer: metaDto.parecer ?? '',
            },
          }),
        ),
      );

      return { ...relatorio, metas: metasCriadas };
    });
  }

  async atualizarMetasDoRelatorio(relatorio: RelatorioComMetas, metas: DadosMeta[]) {
    return this.prisma.client.$transaction(
      metas.map((metaDto) => {
        const metaExistente = relatorio.metas.find(
          (m) => m.eixoDesenvolvimento === metaDto.eixoDesenvolvimento,
        );

        if (metaExistente) {
          return this.prisma.client.metaDesenvolvimento.update({
            where: { id: metaExistente.id },
            data: {
              descricao: metaDto.descricao,
              scoreFinal: metaDto.scoreFinal,
              parecer: metaDto.parecer ?? '',
            },
          });
        }

        return this.prisma.client.metaDesenvolvimento.create({
          data: {
            relatorioSemestralId: relatorio.id,
            eixoDesenvolvimento: metaDto.eixoDesenvolvimento,
            descricao: metaDto.descricao,
            scoreFinal: metaDto.scoreFinal,
            parecer: metaDto.parecer ?? '',
          },
        });
      }),
    );
  }

  async buscarPorEstudante(estudanteId: string): Promise<RelatorioComMetasEPibis[]> {
    return this.prisma.client.relatorioSemestral.findMany({
      where: { estudanteId },
      include: {
        metas: {
          include: {
            pibis: { orderBy: { bimestre: 'asc' } },
          },
        },
      },
      orderBy: [{ ano: 'desc' }, { semestre: 'desc' }],
    });
  }

  async buscarMetaPorId(metaId: string) {
    return this.prisma.client.metaDesenvolvimento.findUnique({ where: { id: metaId } });
  }

  async atualizarAvaliacaoMeta(metaId: string, dados: { scoreFinal: number; parecer?: string }) {
    return this.prisma.client.metaDesenvolvimento.update({
      where: { id: metaId },
      data: {
        scoreFinal: dados.scoreFinal,
        parecer: dados.parecer?.trim() ?? '',
      },
    });
  }

  async atualizarDescricaoMeta(metaId: string, descricao: string) {
    return this.prisma.client.metaDesenvolvimento.update({
      where: { id: metaId },
      data: { descricao },
    });
  }

  async excluirMeta(metaId: string) {
    return this.prisma.client.metaDesenvolvimento.delete({ where: { id: metaId } });
  }

  async buscarRelatorioComMetasPorId(relatorioId: string): Promise<RelatorioComMetas | null> {
    return this.prisma.client.relatorioSemestral.findUnique({
      where: { id: relatorioId },
      include: { metas: true },
    });
  }

  async atualizarDescricoesEmLote(metas: { id: string; descricao: string }[]) {
    return this.prisma.client.$transaction(
      metas.map((meta) =>
        this.prisma.client.metaDesenvolvimento.update({
          where: { id: meta.id },
          data: { descricao: meta.descricao.trim() },
        }),
      ),
    );
  }
}
