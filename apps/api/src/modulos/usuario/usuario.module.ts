import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service.js';
import { UsuarioController } from './usuario.controller.js';
import { PrismaModule } from '../../prisma/prisma.module.js';
import { UsuarioRepository } from './usuario.repository.js';

@Module({
  imports: [PrismaModule],
  providers: [
    UsuarioService,
    {
      provide: 'IUsuarioRepositorio',
      useClass: UsuarioRepository,
    },
  ],
  controllers: [UsuarioController],
  exports: [UsuarioService],
})
export class UsuarioModule {}
