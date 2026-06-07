import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; 
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    // Configuração do JWT
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService], // Injetamos o leitor de variáveis
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}