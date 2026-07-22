import { Injectable, Inject, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { IResponsavelRepositorio } from './interfaces/IResponsavelRepositorio.js';
import { CriarResponsavelDto } from './dtos/criar-responsavel.dto.js';

@Injectable()
export class ResponsavelService {
  constructor(
    @Inject('IResponsavelRepositorio')
    private readonly responsavelRepository: IResponsavelRepositorio,
  ) {}

  async criar(dados: CriarResponsavelDto) {
    // A senha padrão para todo novo usuário é 'Elo@1234'
    const senhaPadrao = 'Elo@1234';
    const hashSenha = await bcrypt.hash(senhaPadrao, 10);

    try {
      return await this.responsavelRepository.criar(dados, hashSenha);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException('Já existe um responsável com este CPF ou E-mail.');
      }
      throw error;
    }
  }

  buscarPorId(id: string) {
    return this.responsavelRepository.buscarPorId(id);
  }

  private isPrismaUniqueConstraintError(err: unknown): boolean {
    return typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002';
  }
}
