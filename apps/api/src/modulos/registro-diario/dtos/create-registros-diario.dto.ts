import { IsString, IsInt, IsOptional, IsUUID, IsBoolean, IsDateString } from 'class-validator';

export class CreateRegistrosDiarioDto {
  @IsUUID()
  estudanteId!: string;

  @IsUUID()
  educadorId!: string; 

  @IsBoolean()
  @IsOptional()
  preenchido?: boolean;

  @IsDateString()
  @IsOptional()
  data?: string;

  @IsInt()
  scoreComportamento!: number;

  @IsInt()
  scoreInteracao!: number;

  @IsInt()
  scoreFoco!: number;

  @IsInt()
  scoreAutonomia!: number;

  @IsInt()
  statusAlimentacao!: number;

  @IsInt()
  usoBanheiro!: number;

  @IsString()
  @IsOptional()
  anotacoes?: string;
}