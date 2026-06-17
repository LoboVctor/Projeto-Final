import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service.js';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto.js';

@Injectable()
export class AutenticacaoService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const usuario = await this.usuarioService.buscarPorEmail(loginDto.email);

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isMatch = await bcrypt.compare(loginDto.senha, usuario.senha);

    if (!isMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: usuario.id, email: usuario.email };

    const { senha, ...usuarioSemSenha } = usuario;

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: usuarioSemSenha,
    };
  }
}
