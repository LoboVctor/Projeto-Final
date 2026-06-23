import { Module } from '@nestjs/common';
import { EstudoCasoService } from './estudo-de-caso.service.js';
import { EstudoCasoController } from './estudo-de-caso.controller.js';
import { EstudoCasoRepository } from './estudo-de-caso.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [EstudoCasoController],
  providers: [
    EstudoCasoService,
    {
      provide: 'IEstudoCasoRepositorio',
      useClass: EstudoCasoRepository,
    },
  ],
  exports: [EstudoCasoService],
})
export class EstudoCasoModule {}
