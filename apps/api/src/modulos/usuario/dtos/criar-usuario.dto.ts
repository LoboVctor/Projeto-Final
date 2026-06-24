import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CriarUsuarioDto {
  @ApiProperty({ example: 'educador@escola.elo', description: 'Endereço de e-mail do usuário' })
  @IsEmail({}, { message: 'Por favor, forneça um endereço de e-mail válido.' })
  email!: string;

  @ApiProperty({ example: 'SenhaForte123', description: 'Senha de acesso do usuário (mínimo de 6 caracteres)' })
  @IsString()
  @MinLength(6, {
    message: 'A palavra-passe deve ter pelo menos 6 caracteres.',
  })
  senha!: string;

  @ApiPropertyOptional({ example: 'b148ad4a-1111-46bb-80d5-1234567890ab', description: 'ID opcional do educador caso este usuário represente um educador' })
  @IsOptional()
  @IsUUID('4', { message: 'O ID do educador tem de ser um UUID válido.' })
  educadorId?: string;

  @ApiPropertyOptional({ example: 'c148ad4a-2222-46bb-80d5-1234567890ab', description: 'ID opcional do responsável caso este usuário represente um responsável' })
  @IsOptional()
  @IsUUID('4', { message: 'O ID do responsável tem de ser um UUID válido.' })
  responsavelId?: string;
}
