import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FormatoExportacao } from '../../../../../infra/generated/prisma/index.js';

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.client.auditoriaExportacao.create({
      data: {
        usuarioId,
        entidade,
        formato,
        detalhes,
      },
    });
  }
}
