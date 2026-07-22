import { ConflictException, Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IRelatorioSemestralRepositorio } from './interfaces/IRelatorioSemestralRepositorio.js';
import { CreateRelatorioSemestralDto } from './dtos/create-relatorio-semestral.dto.js';
import { UpdateMetasLoteDto } from './dtos/update-metas-lote.dto.js';

@Injectable()
export class RelatorioSemestralService {
  constructor(
    @Inject('IRelatorioSemestralRepositorio')
    private readonly relatorioSemestralRepositorio: IRelatorioSemestralRepositorio,
  ) {}

  async upsert(dto: CreateRelatorioSemestralDto) {
    const { estudanteId, ano, semestre, metas } = dto;

    const estudante = await this.relatorioSemestralRepositorio.buscarEstudantePorId(estudanteId);

    if (!estudante) {
      throw new NotFoundException('Estudante não encontrado');
    }

    const relatorio = await this.relatorioSemestralRepositorio.buscarRelatorioComMetas(
      estudanteId,
      ano,
      semestre,
    );

    // Se já existir relatório COM metas, bloquear criação (evita sobrescrever registros)
    if (relatorio && relatorio.metas.length > 0) {
      throw new ConflictException(
        'Este aluno já possui metas cadastradas para este semestre. A criação de novas metas não é permitida para evitar substituição dos registros existentes.',
      );
    }

    if (!relatorio) {
      return this.relatorioSemestralRepositorio.criarRelatorioEMetas(estudanteId, ano, semestre, metas);
    }

    const metasResultado = await this.relatorioSemestralRepositorio.atualizarMetasDoRelatorio(
      relatorio,
      metas,
    );

    return { ...relatorio, metas: metasResultado };
  }

  async findByEstudante(estudanteId: string) {
    return this.relatorioSemestralRepositorio.buscarPorEstudante(estudanteId);
  }

  async atualizarAvaliacaoMeta(metaId: string, dto: { scoreFinal: number; parecer?: string }) {
    const meta = await this.relatorioSemestralRepositorio.buscarMetaPorId(metaId);

    if (!meta) {
      throw new NotFoundException('Meta de desenvolvimento não encontrada.');
    }

    return this.relatorioSemestralRepositorio.atualizarAvaliacaoMeta(metaId, dto);
  }

  async atualizarDescricaoMeta(metaId: string, dto: { descricao: string }) {
    const meta = await this.relatorioSemestralRepositorio.buscarMetaPorId(metaId);

    if (!meta) {
      throw new NotFoundException('Meta de desenvolvimento não encontrada.');
    }

    return this.relatorioSemestralRepositorio.atualizarDescricaoMeta(metaId, dto.descricao);
  }

  async excluirMeta(metaId: string) {
    const meta = await this.relatorioSemestralRepositorio.buscarMetaPorId(metaId);

    if (!meta) {
      throw new NotFoundException('Meta de desenvolvimento não encontrada.');
    }

    return this.relatorioSemestralRepositorio.excluirMeta(metaId);
  }

  async atualizarMetasDoSemestre(relatorioId: string, dto: UpdateMetasLoteDto) {
    const relatorio = await this.relatorioSemestralRepositorio.buscarRelatorioComMetasPorId(relatorioId);

    if (!relatorio) {
      throw new NotFoundException('Relatório semestral não encontrado.');
    }

    const metasDoRelatorio = new Set(relatorio.metas.map((meta) => meta.id));

    for (const meta of dto.metas) {
      if (!metasDoRelatorio.has(meta.id)) {
        throw new BadRequestException('Uma ou mais metas não pertencem ao relatório informado.');
      }
    }

    return this.relatorioSemestralRepositorio.atualizarDescricoesEmLote(dto.metas);
  }
}
