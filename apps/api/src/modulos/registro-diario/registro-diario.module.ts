import { Module } from '@nestjs/common';
import { RegistroDiarioService } from './registro-diario.service.js';
import { RegistroDiarioController } from './registro-diario.controller.js';
import { RegistroDiarioRepository } from './registro-diario.repository.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [RegistroDiarioController],
  providers: [
    RegistroDiarioService,
    {
      provide: 'IRegistroDiarioRepositorio',
      useClass: RegistroDiarioRepository,
    },
  ],
  exports: [RegistroDiarioService],
})
export class RegistroDiarioModule {}
