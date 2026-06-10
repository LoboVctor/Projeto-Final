import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  // Injeção do UsersService
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dadosLogin: LoginDto) {
    // Encontra o usuário pelo e-mail fornecido
    const usuario = await this.usersService.findByEmail(dadosLogin.email);
    console.log('Login attempt for:', dadosLogin.email, 'User found:', !!usuario);

    // Se o e-mail não existir na base de dados, ocorre o bloqueio
    if (!usuario) {
      throw new UnauthorizedException('E-mail ou palavra-passe incorretos.');
    }

    // Verifica se a senha fornecida corresponde ao hash armazenado usando bcrypt
    const senhasIguais = await bcrypt.compare(dadosLogin.senha, usuario.senha);
    console.log('Password match:', senhasIguais, 'Input password:', dadosLogin.senha);

    // Se a matemática do hash falhar, bloqueamos o acesso
    if (!senhasIguais) {
      throw new UnauthorizedException('E-mail ou palavra-passe incorretos.');
    }

    // O que vamos guardar dentro do Token (Payload)
    // O 'sub' (subject) é o padrão da indústria para guardar o ID do utilizador
    const payload = { sub: usuario.id, email: usuario.email };

    // Se tudo estiver correto, retiramos a senha por segurança e devolvemos os dados
    const { senha, ...usuarioSemSenha } = usuario;

    // Devolvemos o token assinado e os dados do utilizador
    return {
      access_token: await this.jwtService.signAsync(payload),
      usuario: usuarioSemSenha,
    };
  }
}
