import { Controller, Post, Body } from '@nestjs/common';
import { AutenticacaoService } from './autenticacao.service.js';
import { LoginDto } from './dtos/login.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';

@Controller('autenticacao')
export class AutenticacaoController {
  constructor(private readonly autenticacaoService: AutenticacaoService) {}

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.autenticacaoService.login(loginDto);
  }
}
