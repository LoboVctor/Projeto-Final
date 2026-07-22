import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { UnidadeM } from '@prisma-client';
import { ApiProperty } from '@nestjs/swagger';

export class MedicamentoDto {
  @ApiProperty({ description: 'Nome do medicamento' })
  @IsString()
  @IsNotEmpty()
  nomeMedicamento!: string;

  @ApiProperty({ description: 'Dosagem do medicamento' })
  @IsString()
  @IsNotEmpty()
  dosagem!: string;

  @ApiProperty({ description: 'Unidade de medida da dosagem', enum: UnidadeM })
  @IsEnum(UnidadeM)
  @IsNotEmpty()
  unidadeMedida!: UnidadeM;
}
