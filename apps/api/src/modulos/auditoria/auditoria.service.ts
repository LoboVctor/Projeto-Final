import { Injectable, Inject } from '@nestjs/common';
import { FormatoExportacao } from '@prisma-client';
import type { IAuditoriaRepositorio } from './interfaces/IAuditoriaRepositorio.js';

@Injectable()
export class AuditoriaService {
  constructor(
    @Inject('IAuditoriaRepositorio')
    private readonly auditoriaRepositorio: IAuditoriaRepositorio,
  ) {}

  /**
   * Registra uma ação de exportação de dados no banco de dados.
   * @param usuarioId - ID do usuário que realizou a exportação (extraído do JWT)
   * @param entidade - Identificador da entidade exportada (ex: 'ALUNOS_COORDENADOR')
   * @param formato - Formato do arquivo exportado (CSV ou PDF)
   * @param detalhes - Informações opcionais sobre filtros utilizados na exportação
   */
  async registrarExportacao(
    usuarioId: string,
    entidade: string,
    formato: FormatoExportacao = FormatoExportacao.CSV,
    detalhes?: string,
  ) {
    return this.auditoriaRepositorio.registrarExportacao(usuarioId, entidade, formato, detalhes);
  }
}
