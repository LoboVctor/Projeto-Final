import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EstudanteSaude {
  estudanteId: string;
  nomeCompleto: string;
  especificidades: Array<{
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
  private apiUrl = 'http://localhost:3000/api/v1'; 

  constructor(private http: HttpClient) {}

  // --- CRUD DE SAÚDE   ---
getSaude(estudanteId: string): Observable<EstudanteSaude> {
    return this.http.get<EstudanteSaude>(`${this.apiUrl}/estudantes/${estudanteId}/saude`);
  }

  // --- CRUD DE ESPECIFICIDADES ---
  saveEspecificidade(estudanteId: string, dados: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/estudantes/${estudanteId}/especificidades`, dados);
  }

  updateEspecificidade(estudanteId: string, especificidadeId: number, dados: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/estudantes/${estudanteId}/especificidades/${especificidadeId}`, dados);
  }

  deleteEspecificidade(estudanteId: string, especificidadeId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/estudantes/${estudanteId}/especificidades/${especificidadeId}`);
  }
}