import { 
  IsUUID, 
  IsBoolean, 
  IsInt, 
  Min, 
  Max, 
  IsEnum, 
  IsNotEmpty, 
  IsDateString, 
  IsOptional, 
  ValidateNested,
  IsArray
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiaSemana, StatusAula } from '../../../../../../infra/generated/prisma'; 
import { Type } from 'class-transformer';

export class CreateRegistroAulaDto {
  @ApiProperty({ description: 'ID da aula', format: 'uuid' })
  @IsNotEmpty({ message: 'O ID da aula é obrigatório' })
  @IsUUID('4', { message: 'O ID da aula deve ser um UUID válido' })
  aulaId!: string;

  @ApiProperty({ description: 'ID do estudante', format: 'uuid' })
  @IsNotEmpty({ message: 'O ID do estudante é obrigatório' })
  @IsUUID('4', { message: 'O ID do estudante deve ser um UUID válido' })
  estudanteId!: string;

  @ApiProperty({ description: 'Data da aula no formato ISO 8601', example: '2026-06-23' })
  @IsNotEmpty({ message: 'A data da aula é obrigatória' })
  @IsDateString({}, { message: 'A data deve estar no formato ISO8601 (YYYY-MM-DD)' })
  dataAula!: string;

  @ApiProperty({ description: 'Dia da semana da aula', enum: DiaSemana })
  @IsNotEmpty({ message: 'O dia da semana é obrigatório' })
  @IsEnum(DiaSemana, { message: 'Dia da semana inválido' })
  diaSemana!: DiaSemana;

  @ApiProperty({ description: 'Indica se o estudante estava presente na aula' })
  @IsNotEmpty({ message: 'O status de presença é obrigatório' })
  @IsBoolean({ message: 'Presença deve ser um valor booleano' })
  presente!: boolean;

  @ApiProperty({ description: 'Status de ocorrência da aula', enum: StatusAula, default: StatusAula.REALIZADA })
  @IsOptional()
  @IsEnum(StatusAula, { message: 'Status da aula inválido' })
  statusAula?: StatusAula;

  @ApiPropertyOptional({ description: 'Score de participação (de 1 a 5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt({ message: 'O score de participação deve ser um número inteiro' })
  @Min(1, { message: 'O score mínimo é 1' })
  @Max(5, { message: 'O score máximo é 5' })
  scoreParticipacao?: number;

  @ApiPropertyOptional({ description: 'Score do nível de suporte (de 1 a 5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt({ message: 'O score de nível de suporte deve ser um número inteiro' })
  @Min(1, { message: 'O score mínimo é 1' })
  @Max(5, { message: 'O score máximo é 5' })
  scoreNivelSuporte?: number;
}

class DesempenhoEstudanteLoteDto {
  @ApiProperty({ description: 'ID do estudante', format: 'uuid' })
  @IsNotEmpty({ message: 'O ID do estudante é obrigatório' })
  @IsUUID('4', { message: 'O ID do estudante deve ser um UUID válido' })
  estudanteId!: string;

  @ApiProperty({ description: 'Indica se o estudante estava presente' })
  @IsNotEmpty({ message: 'O status de presença é obrigatório' })
  @IsBoolean({ message: 'Presença deve ser um valor booleano' })
  presente!: boolean;

  @ApiPropertyOptional({ description: 'Score de participação (de 1 a 5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt({ message: 'O score de participação deve ser um número inteiro' })
  @Min(1)
  @Max(5)
  scoreParticipacao?: number;

  @ApiPropertyOptional({ description: 'Score do nível de suporte (de 1 a 5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt({ message: 'O score de nível de suporte deve ser um número inteiro' })
  @Min(1)
  @Max(5)
  scoreNivelSuporte?: number;
}


export class CreateRegistroAulaBatchDto {
  @ApiProperty({ description: 'ID da aula', format: 'uuid' })
  @IsNotEmpty({ message: 'O ID da aula é obrigatório' })
  @IsUUID('4', { message: 'O ID da aula deve ser um UUID válido' })
  aulaId!: string;

  @ApiProperty({ description: 'Data da ocorrência da aula (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'A data da aula é obrigatória' })
  @IsDateString({}, { message: 'A data deve estar no formato ISO8601' })
  dataAula!: string;

  @ApiProperty({ description: 'Status global da aula no dia', enum: StatusAula })
  @IsNotEmpty({ message: 'O status da aula é obrigatório' })
  @IsEnum(StatusAula, { message: 'Status da aula inválido' })
  statusAula!: StatusAula;

  @ApiProperty({ description: 'Lista de presença e desempenho dos estudantes', type: [DesempenhoEstudanteLoteDto] })
  @IsArray({ message: 'A lista de estudantes deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => DesempenhoEstudanteLoteDto)
  estudantes!: DesempenhoEstudanteLoteDto[];
}