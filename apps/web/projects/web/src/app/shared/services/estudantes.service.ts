import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Podes colocar esta interface num ficheiro separado (ex: estudante-saude.model.ts)
export interface EstudanteSaude {
  estudanteId: string;
  nomeCompleto: string;
  restricoes: Array<{
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
  // Substitui pela tua URL base da API
  private apiUrl = 'http://localhost:3000/api/v1/estudantes'; 

  constructor(private http: HttpClient) {}

  getSaude(estudanteId: string): Observable<EstudanteSaude> {
    return this.http.get<EstudanteSaude>(`${this.apiUrl}/${estudanteId}/saude`);
  }
}