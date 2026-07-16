import { Injectable, UnauthorizedException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service.js';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto } from './dtos/login.dto.js';
import { EsqueceuSenhaDto } from './dtos/esqueceu-senha.dto.js';
import { RedefinirSenhaDto } from './dtos/redefinir-senha.dto.js';
import { PrimeiroAcessoDto } from './dtos/primeiro-acesso.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';

/** Armazena tokens de redefinição em memória com TTL de 1h (substituir por Redis em produção) */
const resetTokenStore = new Map<string, { email: string; expiry: Date }>();

@Injectable()
export class AutenticacaoService {
  constructor(
    private usuarioService: UsuarioService,
    private jwtService: JwtService,
    private prisma: PrismaService,
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

  /**
   * Altera a senha no primeiro acesso do usuário.
   * Requer que o usuário esteja autenticado via JWT.
   * Após a troca, seta deveMudarSenha = false.
   */
  async primeiroAcesso(usuarioId: string, dto: PrimeiroAcessoDto): Promise<{ message: string }> {
    const usuario = await this.prisma.client.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (!usuario.deveMudarSenha) {
      throw new BadRequestException('Este usuário já realizou a troca de senha obrigatória.');
    }

    const senhaHash = await bcrypt.hash(dto.novaSenha, 12);

    await this.prisma.client.usuario.update({
      where: { id: usuarioId },
      data: {
        senha: senhaHash,
        deveMudarSenha: false,
      },
    });

    return { message: 'Senha alterada com sucesso.' };
  }

  /**
   * Gera um token de redefinição de senha e o armazena em memória por 1 hora.
   * Em produção, este token deve ser enviado por e-mail. Para fins de desenvolvimento,
   * o token é retornado diretamente na resposta.
   */
  async esqueceuSenha(dto: EsqueceuSenhaDto): Promise<{ message: string; token?: string }> {
    const usuario = await this.usuarioService.buscarPorEmail(dto.email);
    if (!usuario) {
      throw new NotFoundException('E-mail não encontrado na plataforma.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    resetTokenStore.set(token, { email: dto.email, expiry });

    // Em produção: enviar e-mail com link contendo o token
    // Por ora, retorna o token na resposta para facilitar o desenvolvimento
    return {
      message: 'Se o e-mail estiver cadastrado, as instruções foram enviadas.',
      token, // REMOVER EM PRODUÇÃO
    };
  }

  async redefinirSenha(dto: RedefinirSenhaDto): Promise<{ message: string }> {
    const dado = resetTokenStore.get(dto.token);

    if (!dado) {
      throw new BadRequestException('Token inválido ou já utilizado.');
    }

    if (new Date() > dado.expiry) {
      resetTokenStore.delete(dto.token);
      throw new BadRequestException('Token expirado. Solicite um novo link.');
    }

    const usuario = await this.usuarioService.buscarPorEmail(dado.email);
    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const senhaHash = await bcrypt.hash(dto.novaSenha, 12);
    await this.prisma.client.usuario.update({
      where: { id: usuario.id },
      data: { senha: senhaHash },
    });

    resetTokenStore.delete(dto.token);

    return { message: 'Senha redefinida com sucesso.' };
  }
}
