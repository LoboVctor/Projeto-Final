import { IsEnum, IsDateString } from 'class-validator';
import { TipoDiagnostico, TipoDocumento } from '@prisma-client';
import { ApiProperty } from '@nestjs/swagger';

export class LaudoDto {
  @ApiProperty({ description: 'Tipo de diagnóstico do laudo', enum: TipoDiagnostico })
  @IsEnum(TipoDiagnostico)
  tipoDiagnostico!: TipoDiagnostico;

  @ApiProperty({ description: 'Tipo do documento anexado', enum: TipoDocumento })
  @IsEnum(TipoDocumento)
  tipoDocumento!: TipoDocumento;

  @ApiProperty({ description: 'Data de emissão do laudo (ISO 8601)' })
  @IsDateString()
  dataEmissao!: string;
}
