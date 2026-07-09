import { Module } from '@nestjs/common';
import { RelatorioSemestralController } from './relatorio-semestral.controller';
import { RelatorioSemestralService } from './relatorio-semestral.service';

@Module({
  controllers: [RelatorioSemestralController],
  providers: [RelatorioSemestralService],
})
export class RelatorioSemestralModule {}
