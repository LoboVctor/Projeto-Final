import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../nucleo/config/api.config';

export interface EventoCalendario {
  id: string;
  titulo: string;
  dataEvento: string;
  descricao?: string;
  educador: {
    id: string;
    nome: string;
    escolaId: string;
  };
}

export interface CreateEventoPayload {
  titulo: string;
  descricao?: string;
  dataEvento: string;
  educadorId: string;
}

@Injectable({ providedIn: 'root' })
export class CalendarioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private get API_URL(): string {
    return `${this.baseUrl}/eventos`;
  }

  buscarEventosDoMes(mes: number, ano: number, escolaId: string): Observable<EventoCalendario[]> {
    return this.http.get<EventoCalendario[]>(this.API_URL, {
      params: { mes: mes + 1, ano, escolaId } // Backend espera mês 1-12, js é 0-11
    });
  }

  criarEvento(payload: CreateEventoPayload): Observable<EventoCalendario> {
    return this.http.post<EventoCalendario>(this.API_URL, payload);
  }

  atualizarEvento(id: string, payload: Partial<CreateEventoPayload>): Observable<EventoCalendario> {
    return this.http.patch<EventoCalendario>(`${this.API_URL}/${id}`, payload);
  }

  removerEvento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}