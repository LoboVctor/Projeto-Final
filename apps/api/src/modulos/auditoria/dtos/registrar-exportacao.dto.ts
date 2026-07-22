import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarExportacaoDto {
  @ApiProperty({
    description: 'Identificador da entidade exportada',
    example: 'ALUNOS_COORDENADOR',
  })
  @IsString()
  @IsNotEmpty()
  entidade!: string;

  @ApiProperty({
    description: 'Formato do arquivo exportado',
    enum: ['CSV', 'PDF'],
    default: 'CSV',
  })
  @IsIn(['CSV', 'PDF'])
  @IsOptional()
  formato?: 'CSV' | 'PDF' = 'CSV';

  @ApiPropertyOptional({
    description: 'Informações opcionais sobre filtros aplicados na exportação',
    example: 'turmaId=abc123',
  })
  @IsString()
  @IsOptional()
  detalhes?: string;
}
