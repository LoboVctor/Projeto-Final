import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../../../infra/generated/prisma/index.js';
import { LoginDto } from './login.dto.js';

export class RegisterDto extends LoginDto {
  @ApiProperty({
    enum: Role,
    example: Role.COORDENADOR,
    description: 'Perfil de acesso do usuário',
  })
  @IsEnum(Role, {
    message: 'Perfil inválido (deve ser COORDENADOR ou PROFESSOR)',
  })
  role!: Role;

  @ApiProperty({
    example: '33000000-0000-0000-0000-000000000000',
    description: 'ID da Escola associada',
  })
  @IsUUID('4', { message: 'ID da Escola inválido' })
  escolaId!: string;

  @ApiProperty({
    example: '11000000-0000-0000-0000-000000000000',
    description: 'ID do Educador associado (opcional)',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID do Educador inválido' })
  educadorId?: string;
}
