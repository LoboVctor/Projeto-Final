import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EstudanteService } from './estudante.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { EspecificidadeDto } from './dtos/create.especifidades.dto.js';
import { VisaoGeralResponseDto } from './dtos/visao-geral-response.dto.js';
import { BuscarEstudantesQueryDto } from './dtos/buscar-estudantes-query.dto.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Estudantes')
@ApiBearerAuth()
@Controller('estudantes')
@UseGuards(JwtAuthGuard)
export class EstudantesController {
  constructor(private readonly estudanteService: EstudanteService) {}

  /**
   * Lista todos os estudantes com filtros opcionais (nome, matrícula, diagnóstico) e paginação.
   * Utilizado pela Tela 4 — Gerenciamento Geral de Alunos.
   */
  @Get()
  @ApiOperation({ summary: 'Lista estudantes com filtros dinâmicos e paginação (Tela 4)' })
  async listarTodos(@Query() query: BuscarEstudantesQueryDto) {
    return this.estudanteService.buscarTodos(query);
  }

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
  @UseInterceptors(FileInterceptor('arquivo', {
    storage: diskStorage({
      destination: './uploads/laudos',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extensao = extname(file.originalname);
        cb(null, `${uniqueSuffix}${extensao}`);
      }
    })
  }))
  async adicionarLaudo(
    @Param('estudanteId') estudanteId: string,
    @Body() body: any,
    @UploadedFile() arquivo: Express.Multer.File,
  ) {
    return this.estudanteService.adicionarLaudo(estudanteId, body, arquivo);
  }

  @Delete(':estudanteId/laudos/:documentoId')
  async removerLaudo(@Param('documentoId') documentoId: string) {
    return this.estudanteService.removerLaudo(documentoId);
  }

  @Patch(':estudanteId/laudos/:documentoId')
  @UseInterceptors(FileInterceptor('arquivo', {
    storage: diskStorage({
      destination: './uploads/laudos',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extensao = extname(file.originalname);
        cb(null, `${uniqueSuffix}${extensao}`);
      }
    })
  }))
  async atualizarLaudo(
    @Param('documentoId') documentoId: string,
    @Body() body: any,
    @UploadedFile() arquivo?: Express.Multer.File,
  ) {
    return this.estudanteService.atualizarLaudo(documentoId, body, arquivo);
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