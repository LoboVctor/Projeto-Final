import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterPayload } from '../models/register-payloads';
import { API_BASE_URL } from '../../core/config/api.config';

@Injectable({
  providedIn: 'root'
})
export class CadastroService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /**
   * Envia o formulário de cadastro para a API.
   * Lógicas de token, roles e interceptors ficam a cargo do backend.
   */
  submeterCadastro(payload: RegisterPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/auth/register`, payload);
  }
}