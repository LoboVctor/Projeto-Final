import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistroDiarioPendente, DiaSemanaRegistro, RegistroDiario, RegistroDiarioPayload } from '../models/registros-diarios.models';
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

  /** Busca os alertas agrupados por professor (para o coordenador) */
  getAlertasEscolaPorProfessor(escolaId?: string): Observable<{ educador: string; pendentes: number }[]> {
    let params = new HttpParams();
    if (escolaId) {
      params = params.set('escolaId', escolaId);
    }
    return this.http.get<{ educador: string; pendentes: number }[]>(`${this.API}/alertas-escola`, { params });
  }

  /** Retorna o resumo mensal de registros do educador */
  getResumoMensal(educadorId: string): Observable<ResumoMensalResponse> {
    const params = new HttpParams().set('educadorId', educadorId);
    return this.http.get<ResumoMensalResponse>(`${this.API}/resumo-mensal`, { params });
  }

  /** Busca a semana de registros para um estudante baseando-se numa data-base */
  getSemana(estudanteId: string, data: string): Observable<DiaSemanaRegistro[]> {
    const params = new HttpParams()
      .set('estudanteId', estudanteId)
      .set('data', data);
    return this.http.get<DiaSemanaRegistro[]>(`${this.API}/semana`, { params });
  }

  /** Salva ou atualiza um registro diário — envia payload completo compatível com o DTO do backend */
  salvarRegistro(payload: RegistroDiarioPayload): Observable<RegistroDiario> {
    return this.http.put<RegistroDiario>(`${this.API}/salvar`, payload);
  }
}