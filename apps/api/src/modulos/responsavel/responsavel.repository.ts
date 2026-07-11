import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CriarResponsavelDto } from './dtos/criar-responsavel.dto.js';

@Injectable()
export class ResponsavelRepository {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dados: CriarResponsavelDto, hashSenha: string) {
    return this.prisma.client.responsavel.create({
      data: {
        cpf: dados.cpf,
        nomeCompleto: dados.nomeCompleto,
        sexo: dados.sexo,
        email: dados.email,
        telefone: dados.telefone,
        bairro: dados.bairro,
        endereco: dados.endereco,
        usuario: {
          create: {
            email: dados.email,
            senha: hashSenha,
            role: 'RESPONSAVEL',
            bloqueado: false,
          },
        },
      },
      select: {
        id: true,
        cpf: true,
        nomeCompleto: true,
        email: true,
        telefone: true,
      },
    });
  }

  async buscarPorId(id: string) {
    return this.prisma.client.responsavel.findUnique({
      where: { id },
      select: {
        id: true,
        cpf: true,
        nomeCompleto: true,
        sexo: true,
        email: true,
        telefone: true,
        bairro: true,
        endereco: true,
        createdAt: true,
        estudantes: {
          select: {
            grauParentesco: true,
            responsavelPrincipal: true,
            estudante: {
              select: {
                id: true,
                nomeCompleto: true,
                matricula: true,
              }
            }
          }
        },
        usuario: { select: { id: true, bloqueado: true } },
      },
    });
  }
}
