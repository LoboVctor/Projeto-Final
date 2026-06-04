import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  // Injeção do UsersService
  constructor(private readonly usersService: UsersService) {}

  async login(dadosLogin: LoginDto) {
    // Encontra o usuário pelo e-mail fornecido
    const usuario = await this.usersService.findByEmail(dadosLogin.email);
    
    // Se o e-mail não existir na base de dados, ocorre o bloqueio
    if (!usuario) {
      throw new UnauthorizedException('E-mail ou palavra-passe incorretos.');
    }

    // Verifica se a senha fornecida corresponde ao hash armazenado usando bcrypt
    const senhasIguais = await bcrypt.compare(dadosLogin.senha, usuario.senha);
    
    // Se a matemática do hash falhar, bloqueamos o acesso
    if (!senhasIguais) {
      throw new UnauthorizedException('E-mail ou palavra-passe incorretos.');
    }

    // Se tudo estiver correto, retiramos a senha por segurança e devolvemos os dados
    const { senha, ...usuarioSemSenha } = usuario;
    return usuarioSemSenha;
  }
}