import { Eixos, StatusRelatorio, Semestre, Bimestre } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PibiResponseDto {
  id!: string;
  bimestre!: Bimestre;
  status!: StatusRelatorio;
  scoreAtingibilidade!: number;
  parecerEvolutivo!: string;
  criadoEm!: Date;
}

export class MetaDesenvolvimentoResponseDto {
  id!: string;
  descricao!: string;
  eixoDesenvolvimento!: Eixos;
  scoreFinal!: number;
  parecer!: string;
  pibis!: PibiResponseDto[];
}

export class RelatorioSemestralResponseDto {
  id!: string;
  semestre!: Semestre;
  ano!: number;
  parecerGlobalDesenvolvimento!: string;
  status!: StatusRelatorio;
  dataFechamento!: Date;
  metas!: MetaDesenvolvimentoResponseDto[];
}

export class PedagogicoResponseDto {
  estudanteId!: string;
  nomeCompleto!: string;
  relatorios!: RelatorioSemestralResponseDto[];
}
