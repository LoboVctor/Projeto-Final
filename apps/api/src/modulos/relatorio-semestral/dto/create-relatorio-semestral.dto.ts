import { IsString, IsNotEmpty, IsEnum, IsInt, IsOptional, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Semestre, Eixos } from '../../../../../../infra/generated/prisma/index.js';

export class MetaDesenvolvimentoDto {
  @IsEnum(Eixos)
  eixoDesenvolvimento!: Eixos;

  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsInt()
  scoreFinal!: number;

  @IsString()
  @IsOptional()
  parecer?: string;
}

export class CreateRelatorioSemestralDto {
  @IsString()
  @IsNotEmpty()
  estudanteId!: string;

  @IsEnum(Semestre)
  semestre!: Semestre;

  @IsInt()
  ano!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MetaDesenvolvimentoDto)
  metas!: MetaDesenvolvimentoDto[];
}
