import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ObterAgendaSemanaDto {
  @ApiProperty({
    description:
      'Data base para buscar a semana (formato ISO 8601, ex: 2026-06-23)',
    example: '2026-06-23',
  })
  @IsNotEmpty({ message: 'A data de início da semana é obrigatória' })
  @IsDateString(
    {},
    { message: 'A data deve estar no formato ISO8601 (YYYY-MM-DD)' },
  )
  dataBase!: string;
}
