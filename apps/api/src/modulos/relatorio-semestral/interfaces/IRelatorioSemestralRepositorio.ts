import { Estudante, RelatorioSemestral, MetaDesenvolvimento, Eixos, Semestre } from '@prisma-client';

export type RelatorioComMetas = RelatorioSemestral & { metas: MetaDesenvolvimento[] };

export type RelatorioComMetasEPibis = RelatorioSemestral & {
  metas: (MetaDesenvolvimento & {
    pibis: { bimestre: string }[];
  })[];
};

export interface DadosMeta {
  eixoDesenvolvimento: Eixos;
  descricao: string;
  scoreFinal: number;
  parecer?: string;
}

export interface IRelatorioSemestralRepositorio {
  buscarEstudantePorId(estudanteId: string): Promise<Estudante | null>;
  buscarRelatorioComMetas(
    estudanteId: string,
    ano: number,
    semestre: Semestre,
  ): Promise<RelatorioComMetas | null>;
  criarRelatorioEMetas(
    estudanteId: string,
    ano: number,
    semestre: Semestre,
    metas: DadosMeta[],
  ): Promise<RelatorioComMetas>;
  atualizarMetasDoRelatorio(
    relatorio: RelatorioComMetas,
    metas: DadosMeta[],
  ): Promise<MetaDesenvolvimento[]>;
  buscarPorEstudante(estudanteId: string): Promise<RelatorioComMetasEPibis[]>;
  buscarMetaPorId(metaId: string): Promise<MetaDesenvolvimento | null>;
  atualizarAvaliacaoMeta(
    metaId: string,
    dados: { scoreFinal: number; parecer?: string },
  ): Promise<MetaDesenvolvimento>;
  atualizarDescricaoMeta(metaId: string, descricao: string): Promise<MetaDesenvolvimento>;
  excluirMeta(metaId: string): Promise<MetaDesenvolvimento>;
  buscarRelatorioComMetasPorId(relatorioId: string): Promise<RelatorioComMetas | null>;
  atualizarDescricoesEmLote(
    metas: { id: string; descricao: string }[],
  ): Promise<MetaDesenvolvimento[]>;
}
