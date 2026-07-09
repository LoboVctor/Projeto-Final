import { Module } from '@nestjs/common';
import { EducadorService } from './educador.service.js';
import { EducadorController } from './educador.controller.js';
import { EducadorRepository } from './educador.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [EducadorService, EducadorRepository],
  controllers: [EducadorController],
  exports: [EducadorService],
})
export class EducadorModule {}
