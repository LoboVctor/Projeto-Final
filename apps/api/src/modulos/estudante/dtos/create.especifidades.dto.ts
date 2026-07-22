import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';
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

  @ApiProperty({ description: 'Descrição detalhada da especificidade', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  descricao!: string;

  @ApiPropertyOptional({ description: 'Observações adicionais (opcional)', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  observacao?: string;
}
