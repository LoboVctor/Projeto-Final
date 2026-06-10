import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegistroDiarioPendente } from '../models/registros-diarios.models';

@Injectable({
  providedIn: 'root'
})
export class RegistrosDiariosService {
  // Injeção de dependência moderna do Angular
  private http = inject(HttpClient);
  
  // Ajuste para a URL real da sua API
  private apiUrl = 'http://localhost:3000/api/v1/registros-diarios'; 

  getAlertasPendentes(educadorId: string): Observable<RegistroDiarioPendente[]> {
    return this.http.get<RegistroDiarioPendente[]>(`${this.apiUrl}/alertas?educadorId=${educadorId}`);
  }
}