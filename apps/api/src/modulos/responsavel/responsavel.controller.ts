import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ResponsavelService } from './responsavel.service.js';
import { CriarResponsavelDto } from './dtos/criar-responsavel.dto.js';

@ApiTags('Responsaveis')
@ApiBearerAuth()
@Controller('responsaveis')
export class ResponsavelController {
  constructor(private readonly responsavelService: ResponsavelService) {}

  /**
   * POST /responsaveis
   * Cria um novo responsável e um usuário associado a ele.
   */
  @Post()
  @ApiOperation({ summary: 'Cria um novo responsável' })
  criar(@Body() dto: CriarResponsavelDto) {
    return this.responsavelService.criar(dto);
  }

  /**
   * GET /responsaveis/:id
   * Retorna os dados completos de um responsável por ID.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Retorna os dados de um responsável específico' })
  @ApiParam({ name: 'id', description: 'UUID do responsável' })
  buscarPorId(@Param('id') id: string) {
    return this.responsavelService.buscarPorId(id);
  }
}
