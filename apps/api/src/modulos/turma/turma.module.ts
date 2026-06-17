import { Module } from '@nestjs/common';
import { TurmaService } from './turma.service.js';
import { TurmaController } from './turma.controller.js';
import { TurmaRepository } from './turma.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [
    TurmaService,
    {
      provide: 'ITurmaRepositorio',
      useClass: TurmaRepository,
    },
  ],
  controllers: [TurmaController],
  exports: [TurmaService],
})
export class TurmaModule {}
