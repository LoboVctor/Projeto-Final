import { Sexo, Fcom, Turno, Etapa, CategoriaEspecificidade, TipoEspecificidade } from '@prisma-client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TurmaVisaoGeralDto {
  nome!: string;
  turno!: Turno;
  anoLetivo!: number;
  etapa?: Etapa;
}

export class ProfessorRegenteDto {
  nomeCompleto!: string;
}

export class ResponsavelVisaoGeralDto {
  nomeCompleto!: string;
  telefone!: string;
  email!: string;
  endereco!: string;
}

export class EspecificidadeVisaoGeralDto {
  especificidadeId!: number;
  categoria!: CategoriaEspecificidade;
  tipo!: TipoEspecificidade;
  descricao!: string;
  observacao!: string;
}

export class VisaoGeralResponseDto {
  id!: string;
  nomeCompleto!: string;
  dataNascimento!: Date;
  cpf!: string;
  sexo!: Sexo;
  formaComunicacao!: Fcom;
  foto!: string;

  turma!: TurmaVisaoGeralDto | null;
  professorRegente?: ProfessorRegenteDto | null;
  responsavel?: ResponsavelVisaoGeralDto | null;
  especificidades!: EspecificidadeVisaoGeralDto[];
}
