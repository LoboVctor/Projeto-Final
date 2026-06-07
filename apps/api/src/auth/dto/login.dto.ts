import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Por favor, forneça um e-mail válido para o login.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'A palavra-passe tem de ter pelo menos 6 caracteres.' })
  senha!: string;
}