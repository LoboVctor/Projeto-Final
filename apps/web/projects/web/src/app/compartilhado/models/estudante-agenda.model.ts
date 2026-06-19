export interface EventoAgenda {
  aulaId: string;
  titulo: string;
  educador: string;
  horarioInicio: string | null;
  horarioFim: string | null;
  tipoVisual: 'especializado' | 'regencia'; 
}

export interface DiaAgenda {
  data: string; 
  diaSemana: string; 
  eventos: EventoAgenda[];
}