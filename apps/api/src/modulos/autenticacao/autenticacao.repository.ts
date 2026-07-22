import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IAutenticacaoRepositorio } from './interfaces/IAutenticacaoRepositorio.js';

@Injectable()
export class AutenticacaoRepository implements IAutenticacaoRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarUsuarioPorId(id: string) {
    return this.prisma.client.usuario.findUnique({ where: { id } });
  }

  async atualizarSenha(usuarioId: string, senhaHash: string): Promise<void> {
    await this.prisma.client.usuario.update({
      where: { id: usuarioId },
      data: { senha: senhaHash },
    });
  }

  async concluirPrimeiroAcesso(usuarioId: string, senhaHash: string): Promise<void> {
    await this.prisma.client.usuario.update({
      where: { id: usuarioId },
      data: {
        senha: senhaHash,
        deveMudarSenha: false,
      },
    });
  }
}
