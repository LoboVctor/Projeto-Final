import { IsDateString, IsNotEmpty } from 'class-validator';

export class ObterAgendaSemanaDto {
  @IsNotEmpty({ message: 'A data de início da semana é obrigatória' })
  @IsDateString({}, { message: 'A data deve estar no formato ISO8601 (YYYY-MM-DD)' })
  dataBase!: string;
}