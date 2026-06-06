export interface ResponsavelRegisterPayload {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  endereco: string;
  sexo: string;
}

export interface EducadorRegisterPayload {
  nome: string;
  cpf: string;
  especialidade: string;
  telefone: string;
  dataContratacao: string;
  sexo: string;
}

export type RegisterPayload = ResponsavelRegisterPayload | EducadorRegisterPayload;
