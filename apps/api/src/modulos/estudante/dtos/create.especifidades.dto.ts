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

  @ApiProperty({ description: 'Descrição detalhada da especificidade' })
  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @ApiPropertyOptional({ description: 'Observações adicionais (opcional)' })
  @IsString()
  @IsOptional()
  observacao?: string;
}