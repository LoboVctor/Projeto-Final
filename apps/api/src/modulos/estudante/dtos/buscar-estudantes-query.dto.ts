import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Sexo, Fcom, CategoriaEspecificidade } from '@prisma-client';

/**
 * Query params para o endpoint GET /estudantes.
 * Todos os campos são opcionais; a ausência de filtros retorna todos os registros paginados.
 */
export class BuscarEstudantesQueryDto {
  /** Filtra por parte do nome completo do estudante (case-insensitive) */
  @ApiPropertyOptional({ description: 'Filtra por parte do nome do estudante' })
  @IsOptional()
  @IsString()
  nome?: string;

  /** Filtra pela matrícula exata do estudante */
  @ApiPropertyOptional({ description: 'Filtra pela matrícula do estudante' })
  @IsOptional()
  @IsString()
  matricula?: string;

  /** Filtra por tipo de diagnóstico (ex: "TEA", "TDAH") */
  @ApiPropertyOptional({
    description: 'Filtra por tipo de diagnóstico (ex: TEA, TDAH)',
  })
  @IsOptional()
  @IsString()
  diagnosticoTipo?: string;

  /** Filtra por sexo do estudante */
  @ApiPropertyOptional({ enum: Sexo, description: 'Filtra por sexo (MASCULINO, FEMININO, OUTRO)' })
  @IsOptional()
  @IsEnum(Sexo)
  sexo?: Sexo;

  /** Filtra por ID da turma */
  @ApiPropertyOptional({ description: 'Filtra por ID da turma' })
  @IsOptional()
  @IsString()
  turmaId?: string;

  /** Filtra por forma de comunicação */
  @ApiPropertyOptional({ enum: Fcom, description: 'Filtra por forma de comunicação (VERBAL, NAO_VERBAL)' })
  @IsOptional()
  @IsEnum(Fcom)
  formaComunicacao?: Fcom;

  /** Filtra por categoria de especificidade */
  @ApiPropertyOptional({ enum: CategoriaEspecificidade, description: 'Filtra por categoria de especificidade' })
  @IsOptional()
  @IsEnum(CategoriaEspecificidade)
  categoriaEspecificidade?: CategoriaEspecificidade;

  /** Idade mínima do estudante (inclusive) */
  @ApiPropertyOptional({ description: 'Idade mínima do estudante' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  idadeMin?: number;

  /** Idade máxima do estudante (inclusive) */
  @ApiPropertyOptional({ description: 'Idade máxima do estudante' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(120)
  idadeMax?: number;

  /** Número da página (1-based). Padrão: 1 */
  @ApiPropertyOptional({
    description: 'Número da página (começa em 1)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /** Quantidade de registros por página. Padrão: 20, máximo: 100 */
  @ApiPropertyOptional({
    description: 'Registros por página (máximo: 100)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /** Filtra por status do estudante (ex: "PENDENTE", "CONCLUIDO") */
  @ApiPropertyOptional({
    description: 'Filtra por status do estudante (ex: PENDENTE, CONCLUIDO)',
  })
  @IsOptional()
  status?: 'PENDENTE' | 'CONCLUIDO';
}
