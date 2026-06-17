import { Module } from '@nestjs/common';
import { EstudanteService } from './estudante.service.js';
import { EstudanteController } from './estudante.controller.js';
import { EstudanteRepository } from './estudante.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [
    EstudanteService,
    {
      provide: 'IEstudanteRepositorio',
      useClass: EstudanteRepository,
    },
  ],
  controllers: [EstudanteController],
  exports: [EstudanteService],
})
export class EstudanteModule {}
