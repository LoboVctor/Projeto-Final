import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RelatorioSemestralService } from './relatorio-semestral.service';
import { CreateRelatorioSemestralDto } from './dto/create-relatorio-semestral.dto';

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
}
