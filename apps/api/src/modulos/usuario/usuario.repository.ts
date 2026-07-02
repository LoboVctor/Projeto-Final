import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  IUsuarioRepositorio,
  CriarUsuarioDados,
} from './interfaces/IUsuarioRepositorio.js';
import { Usuario } from '@prisma-client';

@Injectable()
export class UsuarioRepository implements IUsuarioRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    return this.prisma.client.usuario.findUnique({
      where: { email },
      include: {
        educador: true,
        responsavel: true,
      },
    });
  }

  async criar(dados: CriarUsuarioDados): Promise<Usuario> {
    return this.prisma.client.usuario.create({
      data: {
        email: dados.email,
        senha: dados.senhaHash,
        role: dados.role,
        educadorId: dados.educadorId,
        responsavelId: dados.responsavelId,
      },
    });
  }
}
