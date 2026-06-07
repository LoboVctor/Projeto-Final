import { IsEmail, IsString, MinLength } from 'class-validator';
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
