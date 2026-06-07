import { IsEmail, IsString, MinLength } from 'class-validator';
<<<<<<< HEAD
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@escola.elo',
    description: 'E-mail do usuário',
  })
  @IsEmail({}, { message: 'E-mail inválido' })
  email!: string;

  @ApiProperty({
    example: 'Admin@1234',
    description: 'Senha de acesso (mínimo de 8 caracteres)',
  })
  @IsString()
  @MinLength(8, { message: 'A senha deve conter pelo menos 8 caracteres' })
  senha!: string;
}
=======

export class LoginDto {
  @IsEmail({}, { message: 'Por favor, forneça um e-mail válido para o login.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'A palavra-passe tem de ter pelo menos 6 caracteres.' })
  senha!: string;
}
>>>>>>> d6f221a06f967457b630022e36c1c5978806695d
