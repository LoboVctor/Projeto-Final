import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { KpisTurma } from '../../compartilhado/models/kpis-turma.model';

export interface DiagnosticoResumo {
  id: string;
  nome: string;
  tipo: string;
}

export interface EstudanteResumo {
  id: string;
  nomeCompleto: string;
  foto: string;
  matricula: number;
  dataNascimento: string;
  turmas: { id: string; nome: string }[];
  diagnosticos: { diagnostico: DiagnosticoResumo }[];
}

export interface TurmaResumo {
  id: string;
  nome: string;
  turno: string;
  anoLetivo: number;
  etapa: string;
  escola: { id: string; nome: string };
  _count: { estudantes: number };
}

export interface EstudantesPorTurmaResponse {
  turma: { id: string; nome: string };
  estudantes: EstudanteResumo[];
}

export interface BigNumbersHomeResponse {
  totalAlunos: number;
  scoreMedioDia: number;
  diaDaSemana: number;
}

export interface DadosGraficoTurma {
  diagnosticos: { tipo: string; quantidade: number }[];
  assiduidade: { presentes: number; ausentes: number };
}

/** Métricas calculadas para Big Numbers e gráficos da turma */
export interface MetricasTurma {
  totalAlunos: number;
  idadePredominante: number | null;
  diagnosticoPrincipal: string | null;
  comunicacaoPrincipal: string | null;
  distribuicaoSexo: { sexo: string; quantidade: number }[];
  distribuicaoIdade: { idade: number; quantidade: number }[];
  distribuicaoDiagnostico: { tipo: string; quantidade: number }[];
  distribuicaoComunicacao: { forma: string; quantidade: number }[];
}

/** Métricas da escola inteira (Home do Coordenador) — estende MetricasTurma */
export interface MetricasEscola extends MetricasTurma {
  totalProfessores: number;
  totalTurmas: number;
}

@Injectable({ providedIn: 'root' })
export class TurmasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private get API(): string {
    return `${this.baseUrl}/turmas`;
  }

  /** GET /turmas?educadorId=<uuid> */
  getTurmas(educadorId?: string): Observable<TurmaResumo[]> {
    const params: Record<string, string> = {};
    if (educadorId) params['educadorId'] = educadorId;
    return this.http.get<TurmaResumo[]>(this.API, { params });
  }

  /** GET /turmas/:id/estudantes */
  getEstudantesDaTurma(turmaId: string): Observable<EstudantesPorTurmaResponse> {
    return this.http.get<EstudantesPorTurmaResponse>(`${this.API}/${turmaId}/estudantes`);
  }

  /** GET /turmas/:id/graficos */
  obterGraficosTurma(turmaId: string): Observable<DadosGraficoTurma> {
    return this.http.get<DadosGraficoTurma>(`${this.API}/${turmaId}/graficos`);
  }

  /** GET /turmas/:id/metricas — Big Numbers e distribuições para gráficos */
  obterMetricasTurma(turmaId: string): Observable<MetricasTurma> {
    return this.http.get<MetricasTurma>(`${this.API}/${turmaId}/metricas`);
  }

  obterKpisTurma(turmaId: string, periodo: string = 'semana'): Observable<any> {
    const params = new HttpParams().set('periodo', periodo);
    
    return this.http.get<any>(`${this.API}/${turmaId}/kpis`, { params });
  }

  obterKpisEscola(periodo: string = 'semana'): Observable<any> {
    const params = new HttpParams().set('periodo', periodo);
    
    return this.http.get<any>(`${this.API}/kpis-escola`, { params });
  }

  getBigNumbersHome(educadorId: string) {
    return this.http.get<BigNumbersHomeResponse>(`${this.API}/home/big-numbers/${educadorId}`);
  }

  /**
   * GET /turmas/metricas-escola
   * Retorna Big Numbers e distribuições globais para a Home do Coordenador.
   */
  getDashboardEscola(): Observable<MetricasEscola> {
    return this.http.get<MetricasEscola>(`${this.API}/metricas-escola`);
  }

  obterHistoricoEscola(categoria: string, dataInicio: string, dataFim: string): Observable<any> {
    const params = new HttpParams()
      .set('categoria', categoria)
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim);
    return this.http.get<any>(`${this.API}/historico-escola`, { params });
  }

  obterHistoricoTurma(turmaId: string, categoria: string, dataInicio: string, dataFim: string): Observable<any> {
    const params = new HttpParams()
      .set('categoria', categoria)
      .set('dataInicio', dataInicio)
      .set('dataFim', dataFim);
    return this.http.get<any>(`${this.API}/${turmaId}/historico`, { params });
  }
}
