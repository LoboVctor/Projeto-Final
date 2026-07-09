import { Module } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service.js';
import { AuditoriaController } from './auditoria.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [AuditoriaService],
  controllers: [AuditoriaController],
})
export class AuditoriaModule {}
