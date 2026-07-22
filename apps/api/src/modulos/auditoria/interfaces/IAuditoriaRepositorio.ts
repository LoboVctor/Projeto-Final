import { AuditoriaExportacao, FormatoExportacao } from '@prisma-client';

export interface IAuditoriaRepositorio {
  registrarExportacao(
    usuarioId: string,
    entidade: string,
    formato: FormatoExportacao,
    detalhes?: string,
  ): Promise<AuditoriaExportacao>;
}
