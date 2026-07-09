import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

/** Formatos de arquivo suportados pela trilha de auditoria */
export type FormatoExportacao = 'CSV' | 'PDF';

export interface RegistrarExportacaoPayload {
  entidade: string;
  formato: FormatoExportacao;
  detalhes?: string;
}

/**
 * Serviço responsável por registrar ações de exportação de dados no backend
 * para fins de trilha de auditoria (CSV e PDF).
 *
 * A chamada é feita de forma silenciosa (fire-and-forget via .subscribe())
 * para não bloquear ou atrasar o fluxo de download do usuário.
 */
@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private get API(): string {
    return `${this.baseUrl}/auditoria`;
  }

  /** POST /auditoria/exportacao — registra um download de arquivo */
  registrarDownload(
    entidade: string,
    formato: FormatoExportacao,
    detalhes?: string,
  ): Observable<unknown> {
    const payload: RegistrarExportacaoPayload = { entidade, formato, detalhes };
    return this.http.post(`${this.API}/exportacao`, payload);
  }
}
