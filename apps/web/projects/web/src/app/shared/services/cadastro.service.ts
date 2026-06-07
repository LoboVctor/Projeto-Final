import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RegisterPayload } from '../models/register-payloads';

@Injectable({
  providedIn: 'root'
})
export class CadastroService {
  constructor(private http: HttpClient) { }

  // Apenas envia o formulário preenchido. Lógicas de token, roles e interceptors
  // ficam a cargo do backend/equipe de autenticação.
  submeterCadastro(payload: RegisterPayload): Observable<unknown> {
    return this.http.post(
      `${environment.apiUrl}/auth/register`,
      payload
    );
  }
}