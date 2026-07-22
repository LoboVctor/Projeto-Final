import { Module } from '@nestjs/common';
import { ResponsavelController } from './responsavel.controller.js';
import { ResponsavelService } from './responsavel.service.js';
import { ResponsavelRepository } from './responsavel.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ResponsavelController],
  providers: [
    ResponsavelService,
    {
      provide: 'IResponsavelRepositorio',
      useClass: ResponsavelRepository,
    },
  ],
  exports: [ResponsavelService],
})
export class ResponsavelModule {}
