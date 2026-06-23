import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PeriodoAnalytics {
  SEMANA = 'semana',
  MES = 'mes',
  SEMESTRE = 'semestre',
}

export class AnalyticsQueryDto {
  @IsEnum(PeriodoAnalytics)
  periodo: PeriodoAnalytics = PeriodoAnalytics.SEMANA;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional() 
  @IsString() 
  dataInicio?: string;

  @IsOptional() 
  @IsString() 
  dataFim?: string;
}