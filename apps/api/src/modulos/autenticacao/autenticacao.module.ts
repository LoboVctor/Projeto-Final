import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { AutenticacaoController } from './autenticacao.controller.js';
import { AutenticacaoService } from './autenticacao.service.js';
import { AutenticacaoRepository } from './autenticacao.repository.js';
import { UsuarioModule } from '../usuario/usuario.module.js';
import { PrismaModule } from '../../prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    UsuarioModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // expiresIn exige o tipo StringValue (ms) em tempo de compilação; o valor vem de env var validada no boot
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d') as SignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AutenticacaoController],
  providers: [
    JwtStrategy,
    AutenticacaoService,
    {
      provide: 'IAutenticacaoRepositorio',
      useClass: AutenticacaoRepository,
    },
  ],
  exports: [JwtModule, PassportModule, AutenticacaoService],
})
export class AutenticacaoModule {}
