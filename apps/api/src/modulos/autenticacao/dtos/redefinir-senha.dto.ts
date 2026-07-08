import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedefinirSenhaDto {
  @ApiProperty({ description: 'Token recebido pelo e-mail' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NovaSenha@123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
  novaSenha!: string;
}
