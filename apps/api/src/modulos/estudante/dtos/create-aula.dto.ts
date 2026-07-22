import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Matches
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiaSemana } from '@prisma-client';

export class CreateAulaEstudanteDto {
  @ApiProperty({ description: 'ID do educador (professor/terapeuta)' })
  @IsUUID('4', { message: 'ID do educador inválido' })
  @IsNotEmpty()
  educadorId!: string;

  @ApiPropertyOptional({ description: 'Nome da aula' })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiPropertyOptional({ description: 'ID da área (se for atendimento especializado, ex: Fono)' })
  @IsInt()
  @IsOptional()
  areaId?: number;

  @ApiProperty({ description: 'Dia da semana da aula', enum: DiaSemana })
  @IsEnum(DiaSemana, { message: 'Dia da semana inválido' })
  @IsNotEmpty()
  diaSemana!: DiaSemana;

  @ApiProperty({ description: 'Horário de início (HH:mm)', example: '08:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Horário inválido (use HH:mm)' })
  horarioInicio!: string;

  @ApiProperty({ description: 'Horário de fim (HH:mm)', example: '09:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Horário inválido (use HH:mm)' })
  horarioFim!: string;
}
