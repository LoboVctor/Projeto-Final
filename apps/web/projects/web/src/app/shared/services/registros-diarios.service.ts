import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistroDiarioPendente } from '../models/registros-diarios.models';

export interface ResumoMensalResponse {
  totalEsperado: number;
  totalPreenchidos: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrosDiariosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/v1/registros-diarios'; 

  // Busca os alertas pendentes (dias anteriores não preenchidos)
  getAlertasPendentes(educadorId: string): Observable<RegistroDiarioPendente[]> {
    return this.http.get<RegistroDiarioPendente[]>(`${this.apiUrl}/alertas?educadorId=${educadorId}`);
  }

  // Consome o método getResumoMensal(educadorId) do NestJS
  getResumoMensal(educadorId: string): Observable<ResumoMensalResponse> {
    return this.http.get<ResumoMensalResponse>(`${this.apiUrl}/resumo-mensal?educadorId=${educadorId}`);
  }
}