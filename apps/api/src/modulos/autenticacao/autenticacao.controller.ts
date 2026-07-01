import { Controller, Post, Body } from '@nestjs/common';
import { AutenticacaoService } from './autenticacao.service.js';
import { LoginDto } from './dtos/login.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Autenticação')
@Controller('autenticacao')
export class AutenticacaoController {
  constructor(private readonly autenticacaoService: AutenticacaoService) {}

  @Public()
  @Post('login')
  @ApiOperation({
    summary: 'Realiza o login de um usuário e retorna o token de acesso',
  })
  login(@Body() loginDto: LoginDto) {
    return this.autenticacaoService.login(loginDto);
  }
}
