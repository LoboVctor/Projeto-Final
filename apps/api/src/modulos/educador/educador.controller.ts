import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  Request,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EducadorService } from './educador.service.js';
import { AtualizarEducadorDto } from './dtos/atualizar-educador.dto.js';
import { CriarEducadorDto } from './dtos/criar-educador.dto.js';
import { TipoEducador } from '@prisma/client';

@ApiTags('Educadores')
@ApiBearerAuth()
@Controller('educadores')
export class EducadorController {
  constructor(private readonly educadorService: EducadorService) {}

  /**
   * POST /educadores
   * Cria um novo educador e um usuário associado a ele.
   */
  @Post()
  @ApiOperation({ summary: 'Cria um novo educador' })
  async criar(@Body() dto: CriarEducadorDto, @Request() req: any) {
    const logadoId = req.user.educadorId;
    if (!logadoId) {
      throw new UnauthorizedException('Educador logado não encontrado no token');
    }
    return this.educadorService.criar(dto, logadoId);
  }

  /**
   * POST /educadores/importar-csv
   * Importa educadores em lote a partir de um arquivo CSV.
   */
  @Post('importar-csv')
  @ApiOperation({ summary: 'Importa educadores via arquivo CSV' })
  @UseInterceptors(FileInterceptor('arquivo'))
  async importarCSV(@UploadedFile() arquivo: Express.Multer.File, @Request() req: any) {
    const logadoId = req.user.educadorId;
    if (!logadoId) {
      throw new UnauthorizedException('Educador logado não encontrado no token');
    }
    if (!arquivo) {
      throw new UnauthorizedException('Arquivo CSV não enviado.');
    }
    return this.educadorService.importarCSV(arquivo, logadoId);
  }

  /**
   * GET /educadores
   * Lista todos os educadores da escola com filtros e paginação.
   * Utilizado pela visão do coordenador — tela de Professores.
   */
  @Get()
  @ApiOperation({ summary: 'Lista educadores com filtros opcionais e paginação' })
  @ApiQuery({ name: 'nome', required: false, type: String })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoEducador })
  @ApiQuery({ name: 'status', required: false, enum: ['ativos', 'inativos', 'todos'], description: 'Filtro de status do educador. Padrão: ativos.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  listar(
    @Query('nome') nome?: string,
    @Query('tipo') tipo?: TipoEducador,
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
  ) {
    return this.educadorService.listar({ nome, tipo, status, page, limit });
  }

  /**
   * GET /educadores/:id
   * Retorna os dados completos de um educador por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Retorna os dados de um educador específico' })
  @ApiParam({ name: 'id', description: 'UUID do educador' })
  buscarPorId(@Param('id') id: string) {
    return this.educadorService.buscarPorId(id);
  }

  /**
   * PATCH /educadores/:id
   * Atualiza dados de um educador e sincroniza suas turmas.
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados pessoais e turmas do educador' })
  @ApiParam({ name: 'id', description: 'UUID do educador' })
  atualizar(@Param('id') id: string, @Body() dto: AtualizarEducadorDto) {
    return this.educadorService.atualizar(id, dto);
  }

  /**
   * DELETE /educadores/:id
   * Soft delete: desativa o educador e bloqueia seu login sem deletar registros.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativa (soft delete) um educador e bloqueia seu acesso ao sistema' })
  @ApiParam({ name: 'id', description: 'UUID do educador' })
  async desativar(@Param('id') id: string) {
    await this.educadorService.desativar(id);
  }

  /**
   * PATCH /educadores/:id/reativar
   * Reativa um educador previamente desativado.
   */
  @Patch(':id/reativar')
  @ApiOperation({ summary: 'Reativa um educador desativado' })
  @ApiParam({ name: 'id', description: 'UUID do educador' })
  async reativar(@Param('id') id: string) {
    await this.educadorService.reativar(id);
  }
}
