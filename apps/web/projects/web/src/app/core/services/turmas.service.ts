import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DiagnosticoResumo {
  id: string;
  nome: string;
  tipo: string;
}

export interface EstudanteResumo {
  id: string;
  nomeCompleto: string;
  foto: string;
  matricula: number;
  diagnosticos: { diagnostico: DiagnosticoResumo }[];
}

export interface TurmaResumo {
  id: string;
  nome: string;
  turno: string;
  anoLetivo: number;
  etapa: string;
  escola: { id: string; nome: string };
  _count: { estudantes: number };
}

export interface EstudantesPorTurmaResponse {
  turma: { id: string; nome: string };
  estudantes: EstudanteResumo[];
}

@Injectable({ providedIn: 'root' })
export class TurmasService {
  private readonly http = inject(HttpClient);
  private readonly API = 'http://localhost:3000/api/v1/turmas';

  /** GET /turmas?educadorId=<uuid> */
  getTurmas(educadorId?: string): Observable<TurmaResumo[]> {
    const params: Record<string, string> = {};
    if (educadorId) params['educadorId'] = educadorId;
    return this.http.get<TurmaResumo[]>(this.API, { params });
  }

  /** GET /turmas/:id/estudantes */
  getEstudantesDaTurma(turmaId: string): Observable<EstudantesPorTurmaResponse> {
    return this.http.get<EstudantesPorTurmaResponse>(`${this.API}/${turmaId}/estudantes`);
  }
}
