import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:3000/api/v1/estudantes'; 

  constructor(private http: HttpClient) {}

getSaude(estudanteId: string): Observable<EstudanteSaude> {
    return this.http.get<EstudanteSaude>(`${this.apiUrl}/${estudanteId}/saude`);
}

saveRestricao(estudanteId: string, dados: any) {
  return this.http.post(`${this.apiUrl}/estudantes/${estudanteId}/restricoes`, dados);
}

updateRestricao(restricaoId: string, dados: any) {
  return this.http.patch(`${this.apiUrl}/restricoes/${restricaoId}`, dados);
}

deleteRestricao(restricaoId: string) {
  return this.http.delete(`${this.apiUrl}/restricoes/${restricaoId}`);
}
}