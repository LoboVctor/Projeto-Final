import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ResponsavelRepository } from './responsavel.repository.js';
import { CriarResponsavelDto } from './dtos/criar-responsavel.dto.js';

@Injectable()
export class ResponsavelService {
  constructor(private readonly responsavelRepository: ResponsavelRepository) {}

  async criar(dados: CriarResponsavelDto) {
    // A senha padrão para todo novo usuário é 'Elo@1234'
    const senhaPadrao = 'Elo@1234';
    const hashSenha = await bcrypt.hash(senhaPadrao, 10);

    try {
      return await this.responsavelRepository.criar(dados, hashSenha);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Já existe um responsável com este CPF ou E-mail.');
      }
      throw error;
    }
  }

  buscarPorId(id: string) {
    return this.responsavelRepository.buscarPorId(id);
  }
}
