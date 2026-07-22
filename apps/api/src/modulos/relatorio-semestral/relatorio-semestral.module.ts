import { Module } from '@nestjs/common';
import { RelatorioSemestralController } from './relatorio-semestral.controller';
import { RelatorioSemestralService } from './relatorio-semestral.service';
import { RelatorioSemestralRepository } from './relatorio-semestral.repository.js';

@Module({
  controllers: [RelatorioSemestralController],
  providers: [
    RelatorioSemestralService,
    {
      provide: 'IRelatorioSemestralRepositorio',
      useClass: RelatorioSemestralRepository,
    },
  ],
})
export class RelatorioSemestralModule {}
