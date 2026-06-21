import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../nucleo/config/api.config';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getDashboardSummary(studentId: string, periodo: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/registros-diarios/dashboard/${studentId}`, { params: { periodo } });
  }

  getAnalyticsHistorico(studentId: string, periodo: string, categoria: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/registros-diarios/analytics/${studentId}`, { params: { periodo, categoria } });
  }
}