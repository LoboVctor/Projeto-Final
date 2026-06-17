import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { TipoEspecificidade, CategoriaEspecificidade } from '@prisma-client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EspecificidadeDto {
  @ApiProperty({ enum: TipoEspecificidade })
  @IsEnum(TipoEspecificidade)
  @IsNotEmpty()
  tipo!: TipoEspecificidade;

  @ApiProperty({ enum: CategoriaEspecificidade })
  @IsEnum(CategoriaEspecificidade)
  @IsNotEmpty()
  categoria!: CategoriaEspecificidade;

  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsString()
  @IsOptional()
  observacao?: string;
}