export interface TurmaVisaoGeral {
  nome: string;
  turno: string;
  anoLetivo: number;
  etapa: string;
}

export interface ProfessorRegente {
  nomeCompleto: string;
}

export interface ResponsavelVisaoGeral {
  nomeCompleto: string;
  telefone: string;
  email: string;
  endereco: string;
}

export interface EspecificidadeVisaoGeral {
  especificidadeId: number;
  categoria: string;
  tipo: string;
  descricao: string;
  observacao: string;
}

export interface EstudanteVisaoGeral {
  id: string;
  nomeCompleto: string;
  dataNascimento: string;
  cpf: string;
  sexo: string;
  formaComunicacao: string;
  foto: string;
  turma: TurmaVisaoGeral | null;
  professorRegente: ProfessorRegente | null;
  responsavel: ResponsavelVisaoGeral | null;
  especificidades: EspecificidadeVisaoGeral[];
}
