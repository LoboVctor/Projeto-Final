import { IsString, IsInt, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateRegistrosDiarioDto {
  @IsUUID()
  estudanteId!: string;

  @IsUUID()
  educadorId!: string; 

  @IsBoolean()
  @IsOptional()
  preenchido?: boolean;

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

  // Agora é opcional, refletindo o String? do Prisma
  @IsString()
  @IsOptional()
  anotacoes?: string;
}