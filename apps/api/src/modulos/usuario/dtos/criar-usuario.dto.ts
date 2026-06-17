import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsUUID,
} from 'class-validator';

export class CriarUsuarioDto {
  @IsEmail({}, { message: 'Por favor, forneça um endereço de e-mail válido.' })
  email!: string;

  @IsString()
  @MinLength(6, {
    message: 'A palavra-passe deve ter pelo menos 6 caracteres.',
  })
  senha!: string;

  @IsOptional()
  @IsUUID('4', { message: 'O ID do educador tem de ser um UUID válido.' })
  educadorId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'O ID do responsável tem de ser um UUID válido.' })
  responsavelId?: string;
}
