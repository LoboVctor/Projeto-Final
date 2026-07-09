import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
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

    if (usuario.bloqueado) {
      throw new ForbiddenException(
        'Seu acesso foi bloqueado. Entre em contato com a coordenação da escola.',
      );
    }

    const payload = { sub: usuario.id, email: usuario.email };

    const { senha, ...usuarioSemSenha } = usuario;

    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: usuarioSemSenha,
    };
  }
}
