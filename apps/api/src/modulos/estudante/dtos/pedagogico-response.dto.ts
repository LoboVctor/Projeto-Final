import { Eixos, StatusRelatorio, Semestre, Bimestre } from '@prisma-client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PibiResponseDto {
  @ApiProperty({ format: 'uuid', description: 'ID do PIBI' })
  id!: string;
  @ApiProperty({ enum: Bimestre, description: 'Bimestre correspondente' })
  bimestre!: Bimestre;
  @ApiProperty({ enum: StatusRelatorio, description: 'Status do relatório' })
  status!: StatusRelatorio;
  @ApiProperty({ description: 'Score de atingibilidade' })
  scoreAtingibilidade!: number;
  @ApiProperty({ description: 'Parecer evolutivo do estudante no período' })
  parecerEvolutivo!: string;
  @ApiProperty({ description: 'Data de criação' })
  criadoEm!: Date;
}

export class MetaDesenvolvimentoResponseDto {
  @ApiProperty({ format: 'uuid', description: 'ID da meta' })
  id!: string;
  @ApiProperty({ description: 'Descrição da meta' })
  descricao!: string;
  @ApiProperty({ enum: Eixos, description: 'Eixo de desenvolvimento' })
  eixoDesenvolvimento!: Eixos;
  @ApiProperty({ description: 'Score final atingido' })
  scoreFinal!: number;
  @ApiProperty({ description: 'Parecer do educador' })
  parecer!: string;
  @ApiProperty({
    type: [PibiResponseDto],
    description: 'Lista de relatórios PIBI vinculados à meta',
  })
  pibis!: PibiResponseDto[];
}

export class RelatorioSemestralResponseDto {
  @ApiProperty({ format: 'uuid', description: 'ID do relatório semestral' })
  id!: string;
  @ApiProperty({ enum: Semestre, description: 'Semestre correspondente' })
  semestre!: Semestre;
  @ApiProperty({ description: 'Ano do relatório' })
  ano!: number;
  @ApiProperty({ description: 'Parecer global de desenvolvimento do semestre' })
  parecerGlobalDesenvolvimento!: string;
  @ApiProperty({ enum: StatusRelatorio, description: 'Status do relatório' })
  status!: StatusRelatorio;
  @ApiProperty({ description: 'Data de fechamento do relatório' })
  dataFechamento!: Date;
  @ApiProperty({
    type: [MetaDesenvolvimentoResponseDto],
    description: 'Lista de metas avaliadas',
  })
  metas!: MetaDesenvolvimentoResponseDto[];
}

export class PedagogicoResponseDto {
  @ApiProperty({ format: 'uuid', description: 'ID do estudante' })
  estudanteId!: string;
  @ApiProperty({ description: 'Nome completo do estudante' })
  nomeCompleto!: string;
  @ApiProperty({
    type: [RelatorioSemestralResponseDto],
    description: 'Relatórios semestrais do estudante',
  })
  relatorios!: RelatorioSemestralResponseDto[];
}
