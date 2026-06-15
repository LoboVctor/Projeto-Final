import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { TipoEspecificidade, CategoriaEspecificidade } from '../../../../../infra/generated/prisma';
export class EspecificidadeDto {
  @IsEnum(TipoEspecificidade)
  @IsNotEmpty()
  tipo!: TipoEspecificidade;

  @IsEnum(CategoriaEspecificidade)
  @IsNotEmpty()
  categoria!: CategoriaEspecificidade;

  @IsString()
  @IsNotEmpty()
  descricao!: string;

  @IsString()
  @IsNotEmpty()
  observacao!: string; 
}