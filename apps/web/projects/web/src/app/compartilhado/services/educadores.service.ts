import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../nucleo/config/api.config';
import { ImportacaoRelatorio } from '../models/importacao-relatorio.model';
import { EducadorResumo } from '../models/gerenciamento-alunos.model';

interface EducadorListagemItem {
  id: string;
  nome: string;
}

interface PaginacaoEducadores {
  data: EducadorListagemItem[];
}

@Injectable({
  providedIn: 'root'
})
export class EducadoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  importarCSV(formData: FormData): Observable<ImportacaoRelatorio> {
    return this.http.post<ImportacaoRelatorio>(`${this.baseUrl}/educadores/importar-csv`, formData);
  }

  criar(payload: Record<string, unknown>): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/educadores`, payload);
  }

  /** Lista resumida (id, nome) de todos os educadores ativos da escola, para seleção em formulários. */
  listarResumo(): Observable<EducadorResumo[]> {
    return this.http
      .get<PaginacaoEducadores>(`${this.baseUrl}/educadores`, { params: { limit: '1000' } })
      .pipe(map((resposta) => resposta.data.map(({ id, nome }) => ({ id, nome }))));
  }
}
