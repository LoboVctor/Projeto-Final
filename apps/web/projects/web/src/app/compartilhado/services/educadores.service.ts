import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../nucleo/config/api.config';
import { ImportacaoRelatorio } from '../models/importacao-relatorio.model';

@Injectable({
  providedIn: 'root'
})
export class EducadoresService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  importarCSV(formData: FormData): Observable<ImportacaoRelatorio> {
    return this.http.post<ImportacaoRelatorio>(`${this.baseUrl}/educadores/importar-csv`, formData);
  }
}
