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
  // O Prisma faz o join e traz os dados do estudante aninhados
  estudante: EstudanteResumo; 
}