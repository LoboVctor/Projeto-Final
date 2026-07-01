import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsArray,
  IsUUID,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Payload para criação de um Estudo de Caso / Ocorrência Pedagógica.
 * Registra uma reunião pedagógica urgente ou anotação emergencial, associando
 * os educadores participantes via tabela pivot (EstudoCasoEducador).
 */
export class CreateEstudoDeCasoDto {
  /** UUID do estudante ao qual o estudo de caso se refere */
  @ApiProperty({ description: 'ID do estudante', format: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  estudanteId!: string;

  /** Data da reunião pedagógica no formato ISO 8601 (ex: "2026-06-18") */
  @ApiProperty({
    description: 'Data da reunião (ISO 8601)',
    example: '2026-06-18',
  })
  @IsDateString()
  @IsNotEmpty()
  dataReuniao!: string;

  /** Parecer/decisão tomada na reunião */
  @ApiProperty({ description: 'Parecer e decisão da reunião pedagógica' })
  @IsString()
  @IsNotEmpty()
  parecerDecisao!: string;

  /** Lista de UUIDs dos educadores participantes (mínimo 1) */
  @ApiProperty({
    description: 'IDs dos educadores participantes',
    type: [String],
    format: 'uuid',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('all', { each: true })
  educadoresIds!: string[];
}
