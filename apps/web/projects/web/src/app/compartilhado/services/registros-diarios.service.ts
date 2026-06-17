import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistroDiarioPendente } from '../models/registros-diarios.models';
import { API_BASE_URL } from '../../nucleo/config/api.config';

export interface ResumoMensalResponse {
  totalEsperado: number;
  totalPreenchidos: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrosDiariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private get API(): string {
    return `${this.baseUrl}/registros-diarios`;
  }

  /** Busca os alertas pendentes (dias anteriores não preenchidos) */
  getAlertasPendentes(educadorId: string): Observable<RegistroDiarioPendente[]> {
    const params = new HttpParams().set('educadorId', educadorId);
    return this.http.get<RegistroDiarioPendente[]>(`${this.API}/alertas`, { params });
  }

  /** Retorna o resumo mensal de registros do educador */
  getResumoMensal(educadorId: string): Observable<ResumoMensalResponse> {
    const params = new HttpParams().set('educadorId', educadorId);
    return this.http.get<ResumoMensalResponse>(`${this.API}/resumo-mensal`, { params });
  }
}