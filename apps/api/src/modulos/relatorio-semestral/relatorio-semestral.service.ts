import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateRelatorioSemestralDto } from './dto/create-relatorio-semestral.dto.js';
import { Eixos } from '../../../../../infra/generated/prisma/index.js';

@Injectable()
export class RelatorioSemestralService {
  constructor(private readonly prismaService: PrismaService) { }

  async upsert(dto: CreateRelatorioSemestralDto) {
    const { estudanteId, ano, semestre, metas } = dto;
    const db = this.prismaService.client;

    // Verificar se o estudante existe
    const estudante = await db.estudante.findUnique({
      where: { id: estudanteId },
    });

    if (!estudante) {
      throw new NotFoundException('Estudante não encontrado');
    }

    // Usar transaction para garantir integridade
    return db.$transaction(async (tx) => {
      // 1. Busca se já existe o relatório para o mesmo semestre e ano
      let relatorio = await tx.relatorioSemestral.findFirst({
        where: { estudanteId, ano, semestre },
        include: { metas: true },
      });

      // 2. Se não existir, cria o relatório básico
      if (!relatorio) {
        relatorio = await tx.relatorioSemestral.create({
          data: {
            estudanteId,
            ano,
            semestre,
            status: 'RASCUNHO',
            parecerGlobalDesenvolvimento: '',
            dataFechamento: new Date(),
          },
          include: { metas: true },
        });
      }

      // 3. Atualiza ou cria as metas por eixo
      const metasResultado = [];

      for (const metaDto of metas) {
        const metaExistente = relatorio.metas.find(
          (m: { eixoDesenvolvimento: Eixos }) => m.eixoDesenvolvimento === metaDto.eixoDesenvolvimento,
        );

        if (metaExistente) {
          const metaAtualizada = await tx.metaDesenvolvimento.update({
            where: { id: metaExistente.id },
            data: {
              descricao: metaDto.descricao,
              scoreFinal: metaDto.scoreFinal,
              parecer: metaDto.parecer ?? '',
            },
          });
          metasResultado.push(metaAtualizada);
        } else {
          const metaNova = await tx.metaDesenvolvimento.create({
            data: {
              relatorioSemestralId: relatorio.id,
              eixoDesenvolvimento: metaDto.eixoDesenvolvimento,
              descricao: metaDto.descricao,
              scoreFinal: metaDto.scoreFinal,
              parecer: metaDto.parecer ?? '',
            },
          });
          metasResultado.push(metaNova);
        }
      }

      return { ...relatorio, metas: metasResultado };
    });
  }

  async findByEstudante(estudanteId: string) {
    const db = this.prismaService.client;
    return db.relatorioSemestral.findMany({
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
}
