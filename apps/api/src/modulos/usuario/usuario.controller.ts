import { Controller, Post, Body } from '@nestjs/common';
import { UsuarioService } from './usuario.service.js';
import { CriarUsuarioDto } from './dtos/criar-usuario.dto.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo usuário (Educador ou Responsável) no sistema' })
  criar(@Body() criarUsuarioDto: CriarUsuarioDto) {
    return this.usuarioService.criar(criarUsuarioDto);
  }
}
