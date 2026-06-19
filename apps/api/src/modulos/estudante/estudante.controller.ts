import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EstudanteService } from './estudante.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { EspecificidadeDto } from './dtos/create.especifidades.dto.js';
import { VisaoGeralResponseDto } from './dtos/visao-geral-response.dto.js';
import { ObterAgendaSemanaDto } from './dtos/obter-agenda-semana.dto.js';

@ApiTags('Estudante')
@ApiBearerAuth()
@Controller('estudantes')
@UseGuards(JwtAuthGuard) 
export class EstudanteController {
  constructor(private readonly estudanteService: EstudanteService) {}

  @Get(':id/visao-geral')
  @ApiOperation({ summary: 'Retorna a visão geral do estudante (dados pessoais, turma, responsável e especificidades)' })
  @ApiOkResponse({ type: VisaoGeralResponseDto })
  async buscarVisaoGeral(@Param('id') id: string) {
    return this.estudanteService.getVisaoGeral(id);
  }

  @Get(':id/saude')
  async buscarDadosSaude(@Param('id') id: string) {
    return this.estudanteService.getSaude(id);
  }

  @Get(':id/pedagogico')
  async buscarDadosPedagogicos(@Param('id') id: string) {
    return this.estudanteService.getPedagogico(id);
  }

  @Get(':id/agenda/semana')
  async obterAgendaSemana(
    @Param('id') id: string,
    @Query() query: ObterAgendaSemanaDto 
  ) {
    return this.estudanteService.obterAgendaSemana(id, query);
  }

  @Post(':estudanteId/especificidades')
  async createEspecificidade(
    @Param('estudanteId') estudanteId: string, 
    @Body() dto: EspecificidadeDto
  ) {
    return this.estudanteService.createEspecificidade(estudanteId, dto);
  }

  @Patch(':estudanteId/especificidades/:especificidadeId')
  async updateEspecificidade(
    @Param('estudanteId') estudanteId: string,
    @Param('especificidadeId', ParseIntPipe) especificidadeId: number, 
    @Body() dto: EspecificidadeDto
  ) {
    return this.estudanteService.updateEspecificidade(estudanteId, especificidadeId, dto);
  }

  @Delete(':estudanteId/especificidades/:especificidadeId')
  async removeEspecificidade(
    @Param('estudanteId') estudanteId: string,
    @Param('especificidadeId', ParseIntPipe) especificidadeId: number
  ) {
    return this.estudanteService.deleteEspecificidade(estudanteId, especificidadeId);
  }
}