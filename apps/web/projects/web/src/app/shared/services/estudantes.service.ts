import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';
import { EstudantePedagogico } from '../models/estudante-pedagogico.model';
import { EstudanteVisaoGeral } from '../models/estudante-visao-geral.model';

export interface EstudanteSaude {
  estudanteId: string;
  nomeCompleto: string;
  especificidades: Array<{
    especificidadeId: number;
    descricao: string;
    categoria: string;
    tipo: string;
    observacao: string;
  }>;
  laudos: Array<{
    id: string;
    diagnostico: string;
    tipo: string;
    urlArquivo: string;
    dataEmissao: string;
  }>;
  medicamentos: Array<{
    nome: string;
    dosagem: string;
    horarioAdministrado: string;
    administradoEscola: boolean;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class EstudantesService {
  private readonly baseUrl = inject(API_BASE_URL);

  constructor(private http: HttpClient) {}

  // --- SAÚDE ---
  getSaude(estudanteId: string): Observable<EstudanteSaude> {
    return this.http.get<EstudanteSaude>(`${this.baseUrl}/estudantes/${estudanteId}/saude`);
  }

  // --- VISÃO GERAL ---
  getVisaoGeral(estudanteId: string): Observable<EstudanteVisaoGeral> {
    return this.http.get<EstudanteVisaoGeral>(`${this.baseUrl}/estudantes/${estudanteId}/visao-geral`);
  }

  // --- PEDAGÓGICO ---
  getPedagogico(estudanteId: string): Observable<EstudantePedagogico> {
    return this.http.get<EstudantePedagogico>(`${this.baseUrl}/estudantes/${estudanteId}/pedagogico`);
  }

  // --- CRUD DE ESPECIFICIDADES ---
  saveEspecificidade(estudanteId: string, dados: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/estudantes/${estudanteId}/especificidades`, dados);
  }

  updateEspecificidade(estudanteId: string, especificidadeId: number, dados: any): Observable<any> {
    return this.http.patch(`${this.baseUrl}/estudantes/${estudanteId}/especificidades/${especificidadeId}`, dados);
  }

  deleteEspecificidade(estudanteId: string, especificidadeId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/estudantes/${estudanteId}/especificidades/${especificidadeId}`);
  }
}