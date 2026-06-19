import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EstudanteService } from './estudante.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EspecificidadeDto } from './dtos/create.especifidades.dto';
import { VisaoGeralResponseDto } from './dtos/visao-geral-response.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Estudantes')
@ApiBearerAuth()
@Controller('estudantes')
@UseGuards(JwtAuthGuard) 
export class EstudantesController {
  constructor(private readonly estudanteService: EstudanteService) {}

  // ==========================================
  // VISÃO GERAL DO ESTUDANTE
  // ==========================================
  @Get(':id/visao-geral')
  @ApiOperation({ summary: 'Retorna a visão geral do estudante (dados pessoais, turma, responsável e especificidades)' })
  @ApiOkResponse({ type: VisaoGeralResponseDto })
  async buscarVisaoGeral(@Param('id') id: string) {
    return this.estudanteService.getVisaoGeral(id);
  }

  // ==========================================
  // DADOS GERAIS DE SAÚDE
  // ==========================================
  @Get(':id/saude')
  async buscarDadosSaude(@Param('id') id: string) {
    return this.estudanteService.getSaude(id);
  }

  // ==========================================
  // DADOS PEDAGÓGICOS (Relatórios + Metas + PIBI)
  // ==========================================
  @Get(':id/pedagogico')
  async buscarDadosPedagogicos(@Param('id') id: string) {
    return this.estudanteService.getPedagogico(id);
  }

  // ==========================================
  // ESPECIFICIDADES / RESTRIÇÕES
  // ==========================================
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


  // ==========================================
  // LAUDOS E DIAGNÓSTICOS
  // ==========================================
  @Post(':estudanteId/laudos')
  @UseInterceptors(FileInterceptor('arquivo'))
  async adicionarLaudo(
    @Param('estudanteId') estudanteId: string,
    @Body() body: any,
    @UploadedFile() arquivo: any,
  ) {
    return this.estudanteService.adicionarLaudo(estudanteId, body, arquivo);
  }

  // ==========================================
  // MEDICAMENTOS
  // ==========================================

  @Post(':estudanteId/medicamentos')
  async addMedicamento(
    @Param('estudanteId') estudanteId: string,
    @Body() dados: any,
  ) {
    return this.estudanteService.addMedicamento(estudanteId, dados);
  }

  @Patch(':estudanteId/medicamentos/:medicamentoId')
  async updateMedicamento(
    @Param('estudanteId') estudanteId: string,
    @Param('medicamentoId') medicamentoId: string,
    @Body() dados: any,
  ) {
    return this.estudanteService.updateMedicamento(estudanteId, Number(medicamentoId), dados);
  }

  @Delete(':estudanteId/medicamentos/:medicamentoId')
  async removeMedicamento(
    @Param('estudanteId') estudanteId: string,
    @Param('medicamentoId') medicamentoId: string,
  ) {
    return this.estudanteService.removeMedicamento(estudanteId, Number(medicamentoId));
  }
}