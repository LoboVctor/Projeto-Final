import { ApiProperty } from '@nestjs/swagger';

export class IndicadorValorVariacaoDto {
  @ApiProperty() valor!: number;
  @ApiProperty() variacao!: number;
}

export class TurmaDashboardResponseDto {
  @ApiProperty({ type: IndicadorValorVariacaoDto })
  mediaGeral!: IndicadorValorVariacaoDto;

  @ApiProperty({ type: IndicadorValorVariacaoDto })
  frequencia!: IndicadorValorVariacaoDto;

  @ApiProperty({ type: Object })
  categorias!: Record<string, IndicadorValorVariacaoDto>;
}