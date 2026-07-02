import {
  Sexo,
  Fcom,
  Turno,
  Etapa,
  CategoriaEspecificidade,
  TipoEspecificidade,
} from '@prisma-client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TurmaVisaoGeralDto {
  @ApiProperty({ description: 'Nome da turma' })
  nome!: string;
  @ApiProperty({ enum: Turno, description: 'Turno da turma' })
  turno!: Turno;
  @ApiProperty({ description: 'Ano letivo' })
  anoLetivo!: number;
  @ApiPropertyOptional({ enum: Etapa, description: 'Etapa de ensino' })
  etapa?: Etapa;
}

export class ProfessorRegenteDto {
  @ApiProperty({ description: 'Nome completo do professor regente' })
  nomeCompleto!: string;
}

export class ResponsavelVisaoGeralDto {
  @ApiProperty({ description: 'Nome completo do responsável' })
  nomeCompleto!: string;
  @ApiProperty({ description: 'Telefone de contato' })
  telefone!: string;
  @ApiProperty({ description: 'Endereço de e-mail' })
  email!: string;
  @ApiProperty({ description: 'Endereço residencial' })
  endereco!: string;
}

export class EspecificidadeVisaoGeralDto {
  @ApiProperty({ description: 'ID da especificidade' })
  especificidadeId!: number;
  @ApiProperty({ enum: CategoriaEspecificidade })
  categoria!: CategoriaEspecificidade;
  @ApiProperty({ enum: TipoEspecificidade })
  tipo!: TipoEspecificidade;
  @ApiProperty({ description: 'Descrição da especificidade' })
  descricao!: string;
  @ApiProperty({ description: 'Observações adicionais' })
  observacao!: string;
}

export class VisaoGeralResponseDto {
  @ApiProperty({ format: 'uuid', description: 'ID do estudante' })
  id!: string;
  @ApiProperty({ description: 'Nome completo do estudante' })
  nomeCompleto!: string;
  @ApiProperty({ description: 'Data de nascimento do estudante' })
  dataNascimento!: Date;
  @ApiProperty({ description: 'CPF do estudante' })
  cpf!: string;
  @ApiProperty({ enum: Sexo, description: 'Sexo biológico' })
  sexo!: Sexo;
  @ApiProperty({ enum: Fcom, description: 'Forma de comunicação principal' })
  formaComunicacao!: Fcom;
  @ApiProperty({ description: 'URL da foto de perfil' })
  foto!: string;

  @ApiProperty({ type: TurmaVisaoGeralDto, nullable: true })
  turma!: TurmaVisaoGeralDto | null;
  @ApiPropertyOptional({ type: ProfessorRegenteDto, nullable: true })
  professorRegente?: ProfessorRegenteDto | null;
  @ApiPropertyOptional({ type: ResponsavelVisaoGeralDto, nullable: true })
  responsavel?: ResponsavelVisaoGeralDto | null;
  @ApiProperty({ type: [EspecificidadeVisaoGeralDto] })
  especificidades!: EspecificidadeVisaoGeralDto[];
}
