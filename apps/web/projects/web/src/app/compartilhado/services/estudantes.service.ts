import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../nucleo/config/api.config';
import { EstudantePedagogico, Semestre, Eixo } from '../models/estudante-pedagogico.model';
import { EstudanteVisaoGeral } from '../models/estudante-visao-geral.model';
import { DiaAgenda } from '../models/estudante-agenda.model';
import {
  BuscaEstudantesParams,
  EstudanteListagemItem,
  EstudoCasoPayload,
  EstudoCasoResponse,
  PaginacaoResponse,
} from '../models/gerenciamento-alunos.model';
import { ImportacaoRelatorio } from '../models/importacao-relatorio.model';

export interface MetaDesenvolvimentoPayload {
  eixoDesenvolvimento: Eixo;
  descricao: string;
  scoreFinal: number;
  parecer?: string;
}

export interface AvaliacaoMetaPayload {
  scoreFinal: number;
  parecer: string;
}

export interface UpsertRelatorioSemestralPayload {
  estudanteId: string;
  semestre: Semestre;
  ano: number;
  metas: MetaDesenvolvimentoPayload[];
}

export interface EspecificidadePayload {
  tipo: string;
  categoria: string;
  descricao: string;
  observacao?: string;
}

export interface EstudanteSaude {
  estudanteId: string;
  nomeCompleto: string;
  especificidades: Array<{
    especificidadeId: number;
    descricao: string;
    categoria: string;
    tipo: string;
    observacao: string;
  }>;
  laudos: Array<{
    id: string;
    diagnostico: string;
    tipo: string;
    urlArquivo: string;
    dataEmissao: string;
    createdAt: string;
  }>;

  medicamentos: Array<{
    medicamentoId: number;
    nome: string;
    dosagem: number;
    unidadeMedida: string;
    intervaloAdministracao: number;
    horarioAdministrado: string;
    administradoEscola: boolean;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class EstudantesService {
  totalEventosSemana = signal<number>(0);
  private readonly baseUrl = inject(API_BASE_URL);

  constructor(private http: HttpClient) { }

  // --- SAÚDE ---
  getSaude(estudanteId: string): Observable<EstudanteSaude> {
    return this.http.get<EstudanteSaude>(`${this.baseUrl}/estudantes/${estudanteId}/saude`);
  }

  // --- VISÃO GERAL ---
  getVisaoGeral(estudanteId: string): Observable<EstudanteVisaoGeral> {
    return this.http.get<EstudanteVisaoGeral>(`${this.baseUrl}/estudantes/${estudanteId}/visao-geral`);
  }

  // --- PEDAGÓGICO ---
  getPedagogico(estudanteId: string): Observable<EstudantePedagogico> {
    return this.http.get<EstudantePedagogico>(`${this.baseUrl}/estudantes/${estudanteId}/pedagogico`);
  }

  // --- CRUD DE ESPECIFICIDADES ---
  saveEspecificidade(estudanteId: string, dados: EspecificidadePayload): Observable<EspecificidadePayload> {
    return this.http.post<EspecificidadePayload>(`${this.baseUrl}/estudantes/${estudanteId}/especificidades`, dados);
  }

  updateEspecificidade(estudanteId: string, especificidadeId: number, dados: EspecificidadePayload): Observable<EspecificidadePayload> {
    return this.http.patch<EspecificidadePayload>(`${this.baseUrl}/estudantes/${estudanteId}/especificidades/${especificidadeId}`, dados);
  }

  deleteEspecificidade(estudanteId: string, especificidadeId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/estudantes/${estudanteId}/especificidades/${especificidadeId}`);
  }

  // --- AGENDA ---
  getAgendaSemana(estudanteId: string, dataBase: string): Observable<DiaAgenda[]> {
    return this.http.get<DiaAgenda[]>(`${this.baseUrl}/estudantes/${estudanteId}/agenda/semana`, {
      params: { dataBase }
    });
  }

  // --- CRUD DE LAUDOS ---
  uploadLaudo(estudanteId: string, formData: FormData): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/estudantes/${estudanteId}/laudos`, formData);
  }

  atualizarLaudo(estudanteId: string, documentoId: string, formData: FormData): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/estudantes/${estudanteId}/laudos/${documentoId}`, formData);
  }

  excluirLaudo(estudanteId: string, documentoId: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/estudantes/${estudanteId}/laudos/${documentoId}`);
  }

  // --- CRUD DE MEDICAMENTOS ---
  saveMedicamento(estudanteId: string, dados: unknown) {
    return this.http.post(`${this.baseUrl}/estudantes/${estudanteId}/medicamentos`, dados);
  }

  updateMedicamento(estudanteId: string, medicamentoId: number, dados: unknown) {
    return this.http.put(`${this.baseUrl}/estudantes/${estudanteId}/medicamentos/${medicamentoId}`, dados);
  }

  deleteMedicamento(estudanteId: string, medicamentoId: number) {
    return this.http.delete(`${this.baseUrl}/estudantes/${estudanteId}/medicamentos/${medicamentoId}`);
  }

  // --- GERENCIAMENTO GERAL (Tela 4) ---

  /**
   * Lista estudantes com filtros dinâmicos e paginação.
   * GET /estudantes?nome=&matricula=&diagnosticoTipo=&page=&limit=
   */
  buscarTodos(params: BuscaEstudantesParams): Observable<PaginacaoResponse<EstudanteListagemItem>> {
    let httpParams = new HttpParams();
    if (params.nome) httpParams = httpParams.set('nome', params.nome);
    if (params.matricula) httpParams = httpParams.set('matricula', params.matricula);
    if (params.diagnosticoTipo) httpParams = httpParams.set('diagnosticoTipo', params.diagnosticoTipo);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sexo) httpParams = httpParams.set('sexo', params.sexo);
    if (params.turmaId) httpParams = httpParams.set('turmaId', params.turmaId);
    if (params.formaComunicacao) httpParams = httpParams.set('formaComunicacao', params.formaComunicacao);
    if (params.categoriaEspecificidade) httpParams = httpParams.set('categoriaEspecificidade', params.categoriaEspecificidade);
    if (params.idadeMin !== undefined) httpParams = httpParams.set('idadeMin', String(params.idadeMin));
    if (params.idadeMax !== undefined) httpParams = httpParams.set('idadeMax', String(params.idadeMax));
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    return this.http.get<PaginacaoResponse<EstudanteListagemItem>>(`${this.baseUrl}/estudantes`, { params: httpParams });
  }


  // --- ESTUDO DE CASO ---

  /**
   * Registra um novo Estudo de Caso / Ocorrência Pedagógica.
   * POST /estudo-de-caso
   */
  criarEstudoCaso(payload: EstudoCasoPayload): Observable<EstudoCasoResponse> {
    return this.http.post<EstudoCasoResponse>(`${this.baseUrl}/estudo-de-caso`, payload);
  }

  // --- METAS / RELATÓRIOS SEMESTRAIS ---

  upsertRelatorioSemestral(payload: UpsertRelatorioSemestralPayload): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/relatorios-semestrais`, payload);
  }

  updateAvaliacaoMeta(metaId: string, payload: AvaliacaoMetaPayload): Observable<unknown> {
    return this.http.put(`${this.baseUrl}/relatorios-semestrais/metas/${metaId}/avaliacao`, payload);
  }

  atualizarMetasSemestre(relatorioId: string, payload: { metas: { id: string; descricao: string }[] }): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/relatorios-semestrais/${relatorioId}/metas`, payload);
  }

  excluirMetasDoRelatorio(relatorioId: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/relatorios-semestrais/${relatorioId}/metas`);
  }

  // --- IMPORTAÇÃO ---
  importarCSV(formData: FormData): Observable<ImportacaoRelatorio> {
    return this.http.post<ImportacaoRelatorio>(`${this.baseUrl}/estudantes/importar-csv`, formData);
  }

  // --- CADASTRO MANUAL ---
  criar(formData: FormData): Observable<unknown> {
    return this.http.post(`${this.baseUrl}/estudantes`, formData);
  }

  // --- ATUALIZAÇÃO ---
  atualizarEstudante(id: string, formData: FormData): Observable<unknown> {
    return this.http.patch(`${this.baseUrl}/estudantes/${id}`, formData);
  }

  // --- DESATIVAÇÃO ---
  desativarEstudante(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/estudantes/${id}`);
  }
}
