import { Module } from '@nestjs/common';
import { EstudanteService } from './estudante.service.js';
import { EstudantesController } from './estudante.controller.js';
import { EstudanteRepository } from './estudante.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { GoogleDriveService } from './google-drive.service.js';

@Module({
  imports: [PrismaModule],
  providers: [
    EstudanteService,
    {
      provide: 'IEstudanteRepositorio',
      useClass: EstudanteRepository,
    },
    GoogleDriveService,
  ],
  controllers: [EstudantesController],
  exports: [EstudanteService],
})
export class EstudanteModule {}
