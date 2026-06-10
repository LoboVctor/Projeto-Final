import { Module } from '@nestjs/common';
import { TurmasService } from './turmas.service';
import { TurmasController } from './turmas.controller';

@Module({
  providers: [TurmasService],
  controllers: [TurmasController]
})
export class TurmasModule {}
