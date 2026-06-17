import { Controller, Post, Body } from '@nestjs/common';
import { UsuarioService } from './usuario.service.js';
import { CriarUsuarioDto } from './dtos/criar-usuario.dto.js';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  criar(@Body() criarUsuarioDto: CriarUsuarioDto) {
    return this.usuarioService.criar(criarUsuarioDto);
  }
}
