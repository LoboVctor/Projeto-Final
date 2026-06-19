import { 
  IsUUID, 
  IsBoolean, 
  IsInt, 
  Min, 
  Max, 
  IsEnum, 
  IsNotEmpty, 
  IsDateString, 
  IsOptional 
} from 'class-validator';
import { DiaSemana } from '../../../../../../infra/generated/prisma'; 

export class CreateRegistroAulaDto {
  @IsNotEmpty({ message: 'O ID da aula é obrigatório' })
  @IsUUID('4', { message: 'O ID da aula deve ser um UUID válido' })
  aulaId!: string;

  @IsNotEmpty({ message: 'A data da aula é obrigatória' })
  @IsDateString({}, { message: 'A data deve estar no formato ISO8601 (YYYY-MM-DD)' })
  dataAula!: string;

  @IsNotEmpty({ message: 'O dia da semana é obrigatório' })
  @IsEnum(DiaSemana, { message: 'Dia da semana inválido' })
  diaSemana!: DiaSemana;

  @IsNotEmpty({ message: 'O status de presença é obrigatório' })
  @IsBoolean({ message: 'Presença deve ser um valor booleano' })
  presente!: boolean;

  @IsOptional()
  @IsInt({ message: 'O score de participação deve ser um número inteiro' })
  @Min(1, { message: 'O score mínimo é 1' })
  @Max(5, { message: 'O score máximo é 5' })
  scoreParticipacao?: number;
}