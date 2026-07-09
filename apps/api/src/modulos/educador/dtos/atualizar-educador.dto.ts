import { IsString, IsOptional, IsArray, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TipoEducador } from '@prisma/client';

export class AtualizarEducadorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefone?: string;

  @ApiPropertyOptional({ enum: TipoEducador })
  @IsOptional()
  @IsEnum(TipoEducador)
  tipo?: TipoEducador;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dataContratacao?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs das turmas associadas ao educador' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  turmaIds?: string[];
}
