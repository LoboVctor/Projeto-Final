import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { AutenticacaoModule } from './modulos/autenticacao/autenticacao.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { UsuarioModule } from './modulos/usuario/usuario.module.js';
import { TurmaModule } from './modulos/turma/turma.module.js';
import { RegistroDiarioModule } from './modulos/registro-diario/registro-diario.module.js';
import { ScheduleModule } from '@nestjs/schedule';
import { EstudanteModule } from './modulos/estudante/estudante.module.js';
import { EstudoCasoModule } from './modulos/estudo-de-caso/estudo-de-caso.module.js';
import { EventoModule } from './modulos/evento/evento.module.js';
import { RelatorioSemestralModule } from './modulos/relatorio-semestral/relatorio-semestral.module.js';
import { EducadorModule } from './modulos/educador/educador.module.js';
import { AuditoriaModule } from './modulos/auditoria/auditoria.module.js';
import { ResponsavelModule } from './modulos/responsavel/responsavel.module.js';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('1d'),
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsuarioModule,
    AutenticacaoModule,
    TurmaModule,
    RegistroDiarioModule,
    EstudanteModule,
    EstudoCasoModule,
    EventoModule,
    RelatorioSemestralModule,
    EducadorModule,
    AuditoriaModule,
    ResponsavelModule,
  ],
  controllers: [],

  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
