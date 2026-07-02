import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
} from '@nestjs/common';
import { RegistroDiarioService } from './registro-diario.service.js';
import { CreateRegistrosDiarioDto } from './dtos/create-registros-diario.dto.js';
import { UpdateRegistrosDiarioDto } from './dtos/update-registros-diario.dto.js';
import { AnalyticsQueryDto } from './dtos/analytics-query.dto.js';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Registros Diários')
@ApiBearerAuth()
@Controller('registros-diarios')
export class RegistroDiarioController {
  constructor(private readonly registroDiarioService: RegistroDiarioService) {}

  @Post()
  @ApiOperation({ summary: 'Cria um novo registro diário' })
  create(@Body() createRegistrosDiarioDto: CreateRegistrosDiarioDto) {
    return this.registroDiarioService.create(createRegistrosDiarioDto);
  }

  @Put('salvar')
  @ApiOperation({
    summary:
      'Cria ou atualiza (upsert) um registro diário com base no estudanteId e data',
  })
  upsert(@Body() dto: CreateRegistrosDiarioDto) {
    return this.registroDiarioService.upsertRegistro(dto);
  }

  @Get('semana')
  @ApiOperation({
    summary:
      'Retorna os registros da semana de um estudante a partir de uma data de referência',
  })
  getSemana(
    @Query('estudanteId') estudanteId: string,
    @Query('data') data: string,
  ) {
    return this.registroDiarioService.getSemana(estudanteId, data);
  }

  @Get('analytics/:id')
  @ApiOperation({
    summary:
      'Retorna dados analíticos de registros diários de um estudante por período e categoria',
  })
  async getAnalytics(
    @Param('id') id: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.registroDiarioService.getStudentAnalytics(
      id,
      query.periodo,
      query.categoria,
      query.dataInicio,
      query.dataFim,
    );
  }

  @Get('dashboard/:id')
  @ApiOperation({
    summary:
      'Retorna o resumo do dashboard de um estudante para exibição em painéis gráficos',
  })
  async getDashboardSummary(
    @Param('id') id: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.registroDiarioService.getDashboardSummary(id, query.periodo);
  }

  @Get('alertas')
  @ApiOperation({
    summary: 'Busca alertas de registros diários anteriores de um educador',
  })
  findAlertas(@Query('educadorId') educadorId: string) {
    return this.registroDiarioService.findAlertasDiasAnteriores(educadorId);
  }

  @Get('resumo-mensal')
  @ApiOperation({
    summary: 'Gera o resumo mensal de registros diários de um educador',
  })
  getResumoMensal(@Query('educadorId') educadorId: string) {
    return this.registroDiarioService.getResumoMensal(educadorId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os registros diários' })
  findAll() {
    return this.registroDiarioService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca um registro diário específico pelo ID' })
  findOne(@Param('id') id: string) {
    return this.registroDiarioService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza os dados de um registro diário' })
  update(
    @Param('id') id: string,
    @Body() updateRegistrosDiarioDto: UpdateRegistrosDiarioDto,
  ) {
    return this.registroDiarioService.update(id, updateRegistrosDiarioDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro diário do sistema' })
  remove(@Param('id') id: string) {
    return this.registroDiarioService.remove(id);
  }
}
