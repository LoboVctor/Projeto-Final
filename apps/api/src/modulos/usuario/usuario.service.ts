import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CriarUsuarioDto } from './dtos/criar-usuario.dto.js';
import type { IUsuarioRepositorio } from './interfaces/IUsuarioRepositorio.js';

@Injectable()
export class UsuarioService {
  constructor(
    @Inject('IUsuarioRepositorio')
    private readonly usuarioRepositorio: IUsuarioRepositorio,
  ) {}

  async criar(data: CriarUsuarioDto) {
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(data.senha, saltRounds);

    const newUser = await this.usuarioRepositorio.criar({
      email: data.email,
      senhaHash,
      role: 'PROFESSOR_REGENTE',
      educadorId: data.educadorId || null,
      responsavelId: data.responsavelId || null,
    });

    const { senha, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async buscarPorEmail(email: string) {
    return this.usuarioRepositorio.buscarPorEmail(email);
  }
}

