import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EstudantesService } from './estudantes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EspecificidadeDto } from './dto/create.especifidades.dto';
import { VisaoGeralResponseDto } from './dto/visao-geral-response.dto';

@ApiTags('Estudantes')
@ApiBearerAuth()
@Controller('estudantes')
@UseGuards(JwtAuthGuard) 
export class EstudantesController {
  constructor(private readonly estudantesService: EstudantesService) {}

  // ==========================================
  // VISÃO GERAL DO ESTUDANTE
  // ==========================================
  @Get(':id/visao-geral')
  @ApiOperation({ summary: 'Retorna a visão geral do estudante (dados pessoais, turma, responsável e especificidades)' })
  @ApiOkResponse({ type: VisaoGeralResponseDto })
  async buscarVisaoGeral(@Param('id') id: string) {
    return this.estudantesService.getVisaoGeral(id);
  }

  // ==========================================
  // DADOS GERAIS DE SAÚDE
  // ==========================================
  @Get(':id/saude')
  async buscarDadosSaude(@Param('id') id: string) {
    return this.estudantesService.getSaude(id);
  }

  // ==========================================
  // DADOS PEDAGÓGICOS (Relatórios + Metas + PIBI)
  // ==========================================
  @Get(':id/pedagogico')
  async buscarDadosPedagogicos(@Param('id') id: string) {
    return this.estudantesService.getPedagogico(id);
  }

  // ==========================================
  // ESPECIFICIDADES / RESTRIÇÕES
  // ==========================================
  @Post(':estudanteId/especificidades')
  async createEspecificidade(
    @Param('estudanteId') estudanteId: string, 
    @Body() dto: EspecificidadeDto
  ) {
    return this.estudantesService.createEspecificidade(estudanteId, dto);
  }

  @Patch(':estudanteId/especificidades/:especificidadeId')
  async updateEspecificidade(
    @Param('estudanteId') estudanteId: string,
    @Param('especificidadeId', ParseIntPipe) especificidadeId: number, 
    @Body() dto: EspecificidadeDto
  ) {
    return this.estudantesService.updateEspecificidade(estudanteId, especificidadeId, dto);
  }

  @Delete(':estudanteId/especificidades/:especificidadeId')
  async removeEspecificidade(
    @Param('estudanteId') estudanteId: string,
    @Param('especificidadeId', ParseIntPipe) especificidadeId: number
  ) {
    return this.estudantesService.deleteEspecificidade(estudanteId, especificidadeId);
  }
}