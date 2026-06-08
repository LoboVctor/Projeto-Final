import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { UsersModule } from './users/users.module';
import * as Joi from 'joi'; // joi é uma biblioteca de validação de esquemas, usada aqui para validar as variáveis de ambiente do .env

@Module({
  imports: [
    ConfigModule.forRoot({
      // Torna as variáveis do .env disponíveis em qualquer módulo sem precisar importar o ConfigModule novamente
      isGlobal: true,

      envFilePath: ['.env', '../../.env'], // Ensina o NestJS a procurar o .env na raiz do processo
      // Define as regras estritas do que devem existir no .env
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(), // A URL de conexão com o banco de dados é obrigatória
        PORT: Joi.number().default(3000),

        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('1d'),
      }),
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [AppController],

  providers: [
    AppService,

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
