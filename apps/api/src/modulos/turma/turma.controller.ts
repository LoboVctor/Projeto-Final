import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TurmaService } from './turma.service.js';

@ApiTags('Turma')
@ApiBearerAuth()
@Controller('turmas')
export class TurmaController {
  constructor(private readonly turmaService: TurmaService) {}

  /**
   * GET /turma?educadorId=<uuid>
   * Lista turmas filtradas pelo educador (via aulas associadas).
   */
  @Get()
  @ApiOperation({
    summary: 'Lista turmas opcionalmente filtradas por educadorId',
  })
  @ApiQuery({
    name: 'educadorId',
    required: false,
    type: String,
    description: 'UUID do educador',
  })
  findAll(@Query('educadorId') educadorId?: string) {
    return this.turmaService.findAll(educadorId);
  }

  /**
   * GET /turma/:id/estudantes
   * Lista os estudantes de uma turma com nome, foto e diagnósticos.
   */
  @Get(':id/estudantes')
  @ApiOperation({
    summary: 'Lista estudantes de uma turma com dados básicos e diagnósticos',
  })
  findEstudantes(@Param('id', ParseUUIDPipe) id: string) {
    return this.turmaService.findEstudantesByTurma(id);
  }

  /**
   * GET /turma/:id/graficos
   * Retorna os dados para renderização de gráficos.
   */
  @Get(':id/graficos')
  @ApiOperation({
    summary: 'Retorna os dados para os gráficos de diagnósticos e assiduidade',
  })
  getGraficos(@Param('id', ParseUUIDPipe) id: string) {
    return this.turmaService.obterDadosGraficos(id);
  }

  /**
   * GET /turmas/:id/metricas
   * Retorna Big Numbers e distribuições para gráficos da turma.
   */
  @Get(':id/metricas')
  @ApiOperation({ summary: 'Retorna métricas agregadas da turma (Big Numbers + distribuições para gráficos)' })
  getMetricas(@Param('id', ParseUUIDPipe) id: string) {
    return this.turmaService.obterMetricasTurma(id);
  }
}
