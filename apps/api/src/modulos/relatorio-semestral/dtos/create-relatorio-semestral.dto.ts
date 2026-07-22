import { IsString, IsNotEmpty, IsEnum, IsInt, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Semestre, Eixos } from '@prisma-client';

export class MetaDesenvolvimentoDto {
  @ApiProperty({ description: 'Eixo de desenvolvimento avaliado', enum: Eixos })
  @IsEnum(Eixos)
  eixoDesenvolvimento!: Eixos;

  @ApiProperty({ description: 'Descrição da meta de desenvolvimento' })
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiProperty({ description: 'Score final da meta' })
  @IsInt()
  scoreFinal!: number;

  @ApiPropertyOptional({ description: 'Parecer sobre a meta' })
  @IsString()
  @IsOptional()
  parecer?: string;
}

export class CreateRelatorioSemestralDto {
  @ApiProperty({ description: 'ID do estudante', format: 'uuid' })
  @IsString()
  @IsNotEmpty()
  estudanteId!: string;

  @ApiProperty({ description: 'Semestre do relatório', enum: Semestre })
  @IsEnum(Semestre)
  semestre!: Semestre;

  @ApiProperty({ description: 'Ano letivo do relatório' })
  @IsInt()
  ano!: number;

  @ApiProperty({ description: 'Metas de desenvolvimento do relatório', type: [MetaDesenvolvimentoDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetaDesenvolvimentoDto)
  metas!: MetaDesenvolvimentoDto[];
}
