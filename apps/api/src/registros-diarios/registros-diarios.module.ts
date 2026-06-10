import { Module } from '@nestjs/common';
import { RegistrosDiariosService } from './registros-diarios.service';
import { RegistrosDiariosController } from './registros-diarios.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RegistrosDiariosController],
  providers: [RegistrosDiariosService],
})
export class RegistrosDiariosModule {}
