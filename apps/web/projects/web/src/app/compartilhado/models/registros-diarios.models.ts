export interface EstudanteResumo {
  id: string;
  nomeCompleto: string;
  foto: string;
}

export interface RegistroDiarioPendente {
  id: string;
  data: string;
  preenchido: boolean;
  estudanteId: string;
  educadorId: string;
  estudante: EstudanteResumo;
}


export interface RegistroDiario {
  id?: string;
  estudanteId: string;
  educadorId: string;
  data: string;
  preenchido: boolean;
  scoreComportamento: number;
  scoreInteracao: number;
  scoreFoco: number;
  scoreAutonomia: number;
  statusAlimentacao: number;
  usoBanheiro: number;
  anotacoes?: string;
}

export interface DiaSemanaRegistro {
  data: string;
  registro: RegistroDiario | null;
}


export interface RegistroDiarioPayload {
  estudanteId: string;
  educadorId: string;
  data: string;
  preenchido: boolean;
  scoreComportamento: number;
  scoreInteracao: number;
  scoreFoco: number;
  scoreAutonomia: number;
  statusAlimentacao: number;
  usoBanheiro: number;
  anotacoes?: string;
}