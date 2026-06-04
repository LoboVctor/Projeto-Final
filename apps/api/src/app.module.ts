import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
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
  providers: [AppService],
})
export class AppModule {}
