import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditoriaExportacao, FormatoExportacao } from '@prisma-client';
import type { IAuditoriaRepositorio } from './interfaces/IAuditoriaRepositorio.js';

@Injectable()
export class AuditoriaRepository implements IAuditoriaRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async registrarExportacao(
    usuarioId: string,
    entidade: string,
    formato: FormatoExportacao,
    detalhes?: string,
  ): Promise<AuditoriaExportacao> {
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
