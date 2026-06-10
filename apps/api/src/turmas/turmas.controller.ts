import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TurmasService } from './turmas.service.js';

@ApiTags('Turmas')
@ApiBearerAuth()
@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  /**
   * GET /turmas?educadorId=<uuid>
   * Lista turmas filtradas pelo educador (via aulas associadas).
   */
  @Get()
  @ApiOperation({ summary: 'Lista turmas opcionalmente filtradas por educadorId' })
  @ApiQuery({ name: 'educadorId', required: false, type: String, description: 'UUID do educador' })
  findAll(@Query('educadorId') educadorId?: string) {
    return this.turmasService.findAll(educadorId);
  }

  /**
   * GET /turmas/:id/estudantes
   * Lista os estudantes de uma turma com nome, foto e diagnósticos.
   */
  @Get(':id/estudantes')
  @ApiOperation({ summary: 'Lista estudantes de uma turma com dados básicos e diagnósticos' })
  findEstudantes(@Param('id', ParseUUIDPipe) id: string) {
    return this.turmasService.findEstudantesByTurma(id);
  }

  /**
   * GET /turmas/:id/graficos
   * Retorna os dados para renderização de gráficos.
   */
  @Get(':id/graficos')
  @ApiOperation({ summary: 'Retorna os dados para os gráficos de diagnósticos e assiduidade' })
  getGraficos(@Param('id', ParseUUIDPipe) id: string) {
    return this.turmasService.obterDadosGraficos(id);
  }
}
