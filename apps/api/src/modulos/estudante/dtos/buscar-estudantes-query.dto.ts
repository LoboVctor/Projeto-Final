import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
