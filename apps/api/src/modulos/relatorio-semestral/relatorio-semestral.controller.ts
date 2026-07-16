import { Controller, Post, Body, Get, Param, Put, Patch, Delete } from '@nestjs/common';
import { RelatorioSemestralService } from './relatorio-semestral.service';
import { CreateRelatorioSemestralDto } from './dto/create-relatorio-semestral.dto';
import { UpdateAvaliacaoMetaDto } from './dto/update-avaliacao-meta.dto';
import { UpdateMetaDescricaoDto } from './dto/update-meta-descricao.dto';
import { UpdateMetasLoteDto } from './dto/update-metas-lote.dto';
@Controller('relatorios-semestrais')
export class RelatorioSemestralController {
  constructor(private readonly relatorioSemestralService: RelatorioSemestralService) { }

  @Post()
  async upsert(@Body() dto: CreateRelatorioSemestralDto) {
    return this.relatorioSemestralService.upsert(dto);
  }

  @Get('estudante/:estudanteId')
  async findByEstudante(@Param('estudanteId') estudanteId: string) {
    return this.relatorioSemestralService.findByEstudante(estudanteId);
  }

  @Put('metas/:metaId/avaliacao')
  async atualizarAvaliacaoMeta(
    @Param('metaId') metaId: string,
    @Body() dto: UpdateAvaliacaoMetaDto,
  ) {
    return this.relatorioSemestralService.atualizarAvaliacaoMeta(metaId, dto);
  }

  @Patch('metas/:metaId')
  async atualizarDescricaoMeta(
    @Param('metaId') metaId: string,
    @Body() dto: UpdateMetaDescricaoDto,
  ) {
    return this.relatorioSemestralService.atualizarDescricaoMeta(metaId, dto);
  }

  @Patch(':relatorioId/metas')
  async atualizarMetasDoSemestre(
    @Param('relatorioId') relatorioId: string,
    @Body() dto: UpdateMetasLoteDto,
  ) {
    return this.relatorioSemestralService.atualizarMetasDoSemestre(relatorioId, dto);
  }

  @Delete('metas/:metaId')
  async excluirMeta(@Param('metaId') metaId: string) {
    return this.relatorioSemestralService.excluirMeta(metaId);
  }
}
