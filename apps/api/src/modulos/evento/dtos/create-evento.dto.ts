import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateEventoDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsDateString()
  dataEvento!: string;

  @IsUUID()
  @IsNotEmpty()
  educadorId!: string;
}
