import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DadosGraficoTurma {
  diagnosticos: { tipo: string; quantidade: number }[];
  assiduidade: { presentes: number; ausentes: number };
}

@Injectable({ providedIn: 'root' })
export class TurmasService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/turmas';

  obterGraficosTurma(turmaId: string): Observable<DadosGraficoTurma> {
    return this.http.get<DadosGraficoTurma>(`${this.API_URL}/${turmaId}/graficos`);
  }
}