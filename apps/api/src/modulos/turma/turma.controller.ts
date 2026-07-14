import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
  ApiResponse
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile, Request, Post, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { TurmaService } from './turma.service.js';
import { KpisTurmaResponseDto } from './dtos/kpis-turma-response.dto.js'; 
import { TurmaDashboardResponseDto } from './dtos/turma-dashboard-response.dto.js';

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
   * POST /turmas/importar-csv
   * Importa turmas em lote a partir de um arquivo CSV.
   */
  @Post('importar-csv')
  @ApiOperation({ summary: 'Importa turmas via arquivo CSV' })
  @UseInterceptors(FileInterceptor('arquivo'))
  async importarCSV(@UploadedFile() arquivo: Express.Multer.File, @Request() req: any) {
    const logadoId = req.user.educadorId;
    if (!logadoId) {
      throw new UnauthorizedException('Educador logado não encontrado no token');
    }
    if (!arquivo) {
      throw new BadRequestException('Arquivo CSV não enviado.');
    }
    return this.turmaService.importarCSV(arquivo, logadoId);
  }

  /**
   * GET /turmas/metricas-escola
   * Retorna Big Numbers e distribuições globais de toda a escola (Visão Coordenador).
   * DEVE ficar antes de qualquer rota com :id para evitar conflito de matching.
   */
  @Get('metricas-escola')
  @ApiOperation({ summary: 'Retorna métricas agregadas de toda a escola (Big Numbers do Coordenador)' })
  @ApiResponse({ status: 200, description: 'Métricas da escola retornadas com sucesso.' })
  getMetricasEscola() {
    return this.turmaService.obterMetricasEscola();
  }

  /**
   * GET /turmas/kpis-escola
   * Retorna KPIs globais agregados de toda a escola.
   * DEVE ficar antes de qualquer rota com :id para evitar conflito de matching.
   */
  @Get('kpis-escola')
  @ApiOperation({ summary: 'Retorna KPIs agregados de toda a escola' })
  @ApiResponse({ status: 200, description: 'KPIs da escola retornados com sucesso.' })
  getKpisEscola(@Query('periodo') periodo?: string) {
    return this.turmaService.obterDashboardEscola(periodo);
  }

  /**
   * GET /turmas/home/big-numbers/:educadorId
   * DEVE ficar antes das rotas com :id para evitar conflito de matching.
   */
  @Get('home/big-numbers/:educadorId')
  async obterBigNumbersHome(@Param('educadorId') educadorId: string) {
    return this.turmaService.obterBigNumbersHome(educadorId);
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

  @Get(':id/kpis')
  obterDashboardTurma(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('periodo') periodo?: string,
  ): Promise<TurmaDashboardResponseDto> {
    return this.turmaService.obterDashboardTurma(id, periodo);
  }

  @Get('historico-escola')
  @ApiOperation({ summary: 'Retorna o histórico de uma categoria agregada de toda a escola' })
  getHistoricoEscola(
    @Query('categoria') categoria: string,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
  ) {
    return this.turmaService.obterHistoricoEscola(categoria, dataInicio, dataFim);
  }

  @Get(':id/historico')
  @ApiOperation({ summary: 'Retorna o histórico de uma categoria de uma turma específica' })
  getHistoricoTurma(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('categoria') categoria: string,
    @Query('dataInicio') dataInicio: string,
    @Query('dataFim') dataFim: string,
  ) {
    return this.turmaService.obterHistoricoTurma(id, categoria, dataInicio, dataFim);
  }
}
