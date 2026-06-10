import { Controller, Get, Param } from '@nestjs/common';
import { TurmasService } from './turmas.service';

@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  @Get(':id/graficos')
  async getGraficos(@Param('id') id: string) {
    return this.turmasService.obterDadosGraficos(id);
  }
}