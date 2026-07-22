import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../nucleo/config/api.config';
import { DashboardEstudanteSummary, AnalyticsHistorico } from '../models/dashboard-estudante.model';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getDashboardSummary(studentId: string, periodo: string): Observable<DashboardEstudanteSummary> {
    return this.http.get<DashboardEstudanteSummary>(`${this.baseUrl}/registros-diarios/dashboard/${studentId}`, { params: { periodo } });
  }

  getAnalyticsHistorico(studentId: string, periodo: string, categoria: string, dataInicio?: string, dataFim?: string): Observable<AnalyticsHistorico> {
    const params: Record<string, string> = { categoria };

    if (dataInicio && dataFim) {
      params['dataInicio'] = dataInicio;
      params['dataFim'] = dataFim;
    } else {
      params['periodo'] = periodo;
    }
    return this.http.get<AnalyticsHistorico>(`${this.baseUrl}/registros-diarios/analytics/${studentId}`, { params });
  }
}