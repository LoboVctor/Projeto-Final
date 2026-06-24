import { IsString, IsInt, IsOptional, IsUUID, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegistrosDiarioDto {
  @ApiProperty({ description: 'ID do estudante' })
  @IsUUID()
  estudanteId!: string;

  @ApiProperty({ description: 'ID do educador responsável pelo registro' })
  @IsUUID()
  educadorId!: string; 

  @ApiPropertyOptional({ description: 'Indica se o registro foi completamente preenchido' })
  @IsBoolean()
  @IsOptional()
  preenchido?: boolean;

  @ApiPropertyOptional({ description: 'Data do registro no formato ISO 8601 (ex: 2026-06-23)', example: '2026-06-23' })
  @IsDateString()
  @IsOptional()
  data?: string;

  @ApiProperty({ description: 'Pontuação de comportamento' })
  @IsInt()
  scoreComportamento!: number;

  @ApiProperty({ description: 'Pontuação de interação social' })
  @IsInt()
  scoreInteracao!: number;

  @ApiProperty({ description: 'Pontuação de foco e atenção' })
  @IsInt()
  scoreFoco!: number;

  @ApiProperty({ description: 'Pontuação de autonomia' })
  @IsInt()
  scoreAutonomia!: number;

  @ApiProperty({ description: 'Status da alimentação (ex: comeu tudo, não quis comer)' })
  @IsInt()
  statusAlimentacao!: number;

  @ApiProperty({ description: 'Uso do banheiro (ex: independente, precisou de ajuda)' })
  @IsInt()
  usoBanheiro!: number;

  @ApiPropertyOptional({ description: 'Anotações gerais e observações sobre o estudante' })
  @IsString()
  @IsOptional()
  anotacoes?: string;
}