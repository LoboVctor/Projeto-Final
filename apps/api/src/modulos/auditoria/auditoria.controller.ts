import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuditoriaService } from './auditoria.service.js';
import { RegistrarExportacaoDto } from './dtos/registrar-exportacao.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { FormatoExportacao } from '../../../../../infra/generated/prisma/index.js';

/** Forma mínima do usuário autenticado injetada pelo JwtStrategy */
interface UsuarioAutenticado {
  id: string;
  email: string;
  role: string;
}

@ApiTags('Auditoria')
@ApiBearerAuth()
@Controller('auditoria')
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Post('exportacao')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra uma ação de exportação de dados (CSV ou PDF)',
  })
  registrarExportacao(
    @CurrentUser() usuario: UsuarioAutenticado,
    @Body() dto: RegistrarExportacaoDto,
  ) {
    return this.auditoriaService.registrarExportacao(
      usuario.id,
      dto.entidade,
      (dto.formato ?? 'CSV') as FormatoExportacao,
      dto.detalhes,
    );
  }
}
