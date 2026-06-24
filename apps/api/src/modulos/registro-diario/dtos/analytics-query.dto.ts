import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PeriodoAnalytics {
  SEMANA = 'semana',
  MES = 'mes',
  SEMESTRE = 'semestre',
}

export class AnalyticsQueryDto {
  @ApiProperty({
    enum: PeriodoAnalytics,
    enumName: 'PeriodoAnalytics',
    description: 'Período de análise dos registros',
    default: PeriodoAnalytics.SEMANA,
    example: PeriodoAnalytics.SEMANA,
  })
  @IsEnum(PeriodoAnalytics)
  periodo: PeriodoAnalytics = PeriodoAnalytics.SEMANA;

  @ApiPropertyOptional({ description: 'Categoria de pontuação a filtrar (ex: comportamento, foco)', example: 'comportamento' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Data de início do filtro personalizado (ISO 8601)', example: '2026-01-01' })
  @IsOptional() 
  @IsString() 
  dataInicio?: string;

  @ApiPropertyOptional({ description: 'Data de fim do filtro personalizado (ISO 8601)', example: '2026-06-30' })
  @IsOptional() 
  @IsString() 
  dataFim?: string;
}