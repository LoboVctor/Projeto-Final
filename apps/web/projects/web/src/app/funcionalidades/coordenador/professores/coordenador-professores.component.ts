import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../nucleo/config/api.config';
import { AuditoriaService } from '../../../nucleo/services/auditoria.service';
import { LoadingFlorComponent } from '../../../compartilhado/components/loading-flor/loading-flor.component';

/** Modelo resumido do educador para listagem */
export interface EducadorListagemItem {
  id: string;
  matricula: string;
  nome: string;
  tipo: string;
  telefone: string;
  ativo: boolean;
  turmas: { id: string; nome: string }[];
  usuario: { id: string; bloqueado: boolean } | null;
}

export interface PaginacaoEducadores {
  data: EducadorListagemItem[];
  total: number;
  totalPaginas: number;
}

export interface TurmaItem {
  id: string;
  nome: string;
}

@Component({
  selector: 'app-coordenador-professores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoadingFlorComponent],
  templateUrl: './coordenador-professores.component.html',
  styleUrls: ['./coordenador-professores.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordenadorProfessoresComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly auditoriaService = inject(AuditoriaService);

  private get apiUrl(): string {
    return `${this.baseUrl}/educadores`;
  }

  private get turmasApiUrl(): string {
    return `${this.baseUrl}/turmas`;
  }

  resposta = signal<PaginacaoEducadores | null>(null);
  loading = signal(true);
  erro = signal<string | null>(null);

  isImporting = signal(false);
  importResult = signal<{ sucesso: number; falhas: number; erros: string[] } | null>(null);

  termoBusca = signal('');
  filtroTipo = signal('');
  filtroStatus = signal('ativos');
  paginaAtual = signal(1);
  readonly limitePorPagina = 5;

  private readonly busca$ = new Subject<void>();

  readonly professores = computed(() => this.resposta()?.data ?? []);
  readonly total = computed(() => this.resposta()?.total ?? 0);
  readonly totalPaginas = computed(() => this.resposta()?.totalPaginas ?? 1);
  readonly temResultados = computed(() => this.professores().length > 0);

  readonly tiposEducador = ['REGENTE', 'ATENDIMENTO', 'COORDENADOR'];
  readonly statusOpcoes = [
    { value: 'ativos', label: 'Ativos' },
    { value: 'inativos', label: 'Inativos' },
  ];

  // ─── Menu de Ações (dropdown de 3 pontos) e Cadastrar ──────────────────
  menuAbertoId = signal<string | null>(null);
  dropdownCadastrarAberto = signal(false);

  toggleMenu(profId: string, event: Event): void {
    event.stopPropagation();
    this.menuAbertoId.set(this.menuAbertoId() === profId ? null : profId);
    this.dropdownCadastrarAberto.set(false);
  }

  toggleDropdownCadastrar(event: Event): void {
    event.stopPropagation();
    this.dropdownCadastrarAberto.set(!this.dropdownCadastrarAberto());
    this.menuAbertoId.set(null);
  }

  fecharMenus(): void {
    this.menuAbertoId.set(null);
    this.dropdownCadastrarAberto.set(false);
  }

  baixarModeloCSV(): void {
    const cabecalho = 'nome,email,cpf,telefone,tipo\n';
    const exemplo = 'Ana Souza,ana@escola.com,12312312312,11999998888,REGENTE\n';
    const blob = new Blob([cabecalho + exemplo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_professores.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ─── Modal de Edição ──────────────────────────────────────────────────────
  modalEditarAberto = signal(false);
  profEmEdicao = signal<EducadorListagemItem | null>(null);
  editarForm!: FormGroup;
  editarLoading = signal(false);
  editarErro = signal<string | null>(null);

  // Turmas disponíveis para seleção no modal
  todasTurmas = signal<TurmaItem[]>([]);
  turmasLoading = signal(false);
  // IDs das turmas selecionadas
  turmasSelecionadas = signal<Set<string>>(new Set());

  // Lógica de busca de turmas
  termoBuscaTurma = signal('');
  readonly turmasFiltradas = computed(() => {
    const termo = this.termoBuscaTurma().toLowerCase();
    if (!termo) return this.todasTurmas();
    return this.todasTurmas().filter(t => t.nome.toLowerCase().includes(termo));
  });

  // Paginação das turmas no modal
  turmasPagina = signal(1);
  readonly turmasPorPagina = 10;
  readonly turmasPaginadas = computed(() => {
    const inicio = (this.turmasPagina() - 1) * this.turmasPorPagina;
    return this.turmasFiltradas().slice(inicio, inicio + this.turmasPorPagina);
  });
  readonly turmasTotalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.turmasFiltradas().length / this.turmasPorPagina))
  );

  abrirModalEditar(prof: EducadorListagemItem): void {
    this.fecharMenus();
    this.profEmEdicao.set(prof);
    this.editarErro.set(null);

    this.editarForm = this.fb.group({
      nome: [prof.nome, [Validators.required, Validators.minLength(3)]],
      cpf: [prof.tipo, []],  // CPF não está na listagem, iniciamos vazio para não forçar
      telefone: [prof.telefone, [Validators.required]],
      tipo: [prof.tipo, [Validators.required]],
    });

    // Pré-seleciona as turmas atuais do professor
    this.turmasSelecionadas.set(new Set(prof.turmas.map(t => t.id)));
    this.turmasPagina.set(1);

    // Carrega todas as turmas disponíveis
    this.carregarTodasTurmas();
    this.modalEditarAberto.set(true);
  }

  fecharModalEditar(): void {
    this.modalEditarAberto.set(false);
    this.profEmEdicao.set(null);
  }

  private carregarTodasTurmas(): void {
    this.turmasLoading.set(true);
    this.http.get<{ data: TurmaItem[] }>(this.turmasApiUrl).subscribe({
      next: (res) => {
        this.todasTurmas.set(res.data ?? (res as unknown as TurmaItem[]));
        this.turmasLoading.set(false);
      },
      error: () => {
        // Fallback: tenta como array direto
        this.http.get<TurmaItem[]>(this.turmasApiUrl).subscribe({
          next: (arr) => { this.todasTurmas.set(arr); this.turmasLoading.set(false); },
          error: () => { this.turmasLoading.set(false); },
        });
      },
    });
  }

  toggleTurma(turmaId: string): void {
    const atual = new Set(this.turmasSelecionadas());
    if (atual.has(turmaId)) {
      atual.delete(turmaId);
    } else {
      atual.add(turmaId);
    }
    this.turmasSelecionadas.set(atual);
  }

  isTurmaSelecionada(turmaId: string): boolean {
    return this.turmasSelecionadas().has(turmaId);
  }

  irParaPaginaTurmas(pagina: number): void {
    if (pagina < 1 || pagina > this.turmasTotalPaginas()) return;
    this.turmasPagina.set(pagina);
  }

  salvarEdicao(): void {
    if (!this.editarForm.valid || !this.profEmEdicao()) return;
    this.editarLoading.set(true);
    this.editarErro.set(null);

    const dados = {
      nome: this.editarForm.value.nome,
      telefone: this.editarForm.value.telefone,
      tipo: this.editarForm.value.tipo,
      turmaIds: Array.from(this.turmasSelecionadas()),
    };

    this.http.patch(`${this.apiUrl}/${this.profEmEdicao()!.id}`, dados).subscribe({
      next: () => {
        this.editarLoading.set(false);
        this.fecharModalEditar();
        this.dispararBusca();
      },
      error: () => {
        this.editarErro.set('Erro ao salvar. Tente novamente.');
        this.editarLoading.set(false);
      },
    });
  }

  // ─── Desativação / Reativação ─────────────────────────────────────────────
  modalConfirmacaoAberto = signal(false);
  profParaDesativar = signal<EducadorListagemItem | null>(null);
  desativarLoading = signal(false);

  confirmarDesativacao(prof: EducadorListagemItem): void {
    this.fecharMenus();
    this.profParaDesativar.set(prof);
    this.modalConfirmacaoAberto.set(true);
  }

  fecharModalConfirmacao(): void {
    this.modalConfirmacaoAberto.set(false);
    this.profParaDesativar.set(null);
  }

  executarDesativacao(): void {
    const prof = this.profParaDesativar();
    if (!prof) return;
    this.desativarLoading.set(true);

    this.http.delete(`${this.apiUrl}/${prof.id}`).subscribe({
      next: () => {
        this.desativarLoading.set(false);
        this.fecharModalConfirmacao();
        this.dispararBusca();
      },
      error: () => { this.desativarLoading.set(false); },
    });
  }

  reativarProfessor(prof: EducadorListagemItem): void {
    this.fecharMenus();
    this.http.patch(`${this.apiUrl}/${prof.id}/reativar`, {}).subscribe({
      next: () => this.dispararBusca(),
    });
  }

  // ─── Busca e Paginação ────────────────────────────────────────────────────

  ngOnInit(): void {
    this.busca$
      .pipe(
        debounceTime(400),
        switchMap(() => {
          this.loading.set(true);
          this.erro.set(null);
          const params: Record<string, string> = {
            page: String(this.paginaAtual()),
            limit: String(this.limitePorPagina),
          };
          const termo = this.termoBusca().trim();
          if (termo) {
            const isMatricula = /^\d+$/.test(termo);
            if (isMatricula) {
              params['matricula'] = termo;
            } else {
              params['nome'] = termo;
            }
          }
          if (this.filtroTipo()) params['tipo'] = this.filtroTipo();
          if (this.filtroStatus()) params['status'] = this.filtroStatus();
          return this.http.get<PaginacaoEducadores>(this.apiUrl, { params });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => { this.resposta.set(res); this.loading.set(false); },
        error: () => { this.erro.set('Erro ao carregar professores. Verifique a conexão com a API.'); this.loading.set(false); },
      });

    this.dispararBusca();
  }

  onTermoBuscaChange(valor: string): void { this.termoBusca.set(valor); this.paginaAtual.set(1); this.dispararBusca(); }
  onFiltroTipoChange(tipo: string): void { this.filtroTipo.set(tipo); this.paginaAtual.set(1); this.dispararBusca(); }
  onFiltroStatusChange(status: string): void { this.filtroStatus.set(status); this.paginaAtual.set(1); this.dispararBusca(); }

  limparFiltros(): void {
    this.termoBusca.set(''); this.filtroTipo.set(''); this.filtroStatus.set('ativos');
    this.paginaAtual.set(1); this.dispararBusca();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina); this.dispararBusca();
  }

  // ─── Helpers de Label/Cor ─────────────────────────────────────────────────

  getTipoLabel(tipo: string): string {
    const mapa: Record<string, string> = { REGENTE: 'Professor Regente', ATENDIMENTO: 'Prof. Atendimento', COORDENADOR: 'Coordenador' };
    return mapa[tipo] ?? tipo;
  }

  getTipoColor(tipo: string): string {
    const mapa: Record<string, string> = {
      REGENTE: 'bg-[#E0F2FE] text-[#0369A1] border-[#7DD3FC]/40',
      ATENDIMENTO: 'bg-[#E6F4EA] text-[#137333] border-[#82CBA2]/40',
      COORDENADOR: 'bg-[#F3E8FF] text-[#6C3CC9] border-[#B79CED]/40',
    };
    return mapa[tipo] ?? 'bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]/40';
  }

  getTurmaLabel(prof: EducadorListagemItem): string {
    if (!prof.turmas || prof.turmas.length === 0) return '—';
    return prof.turmas.map(t => t.nome).join(', ');
  }

  getStatusLabel(prof: EducadorListagemItem): string {
    if (!prof.ativo) return 'Inativo';
    if (prof.usuario?.bloqueado) return 'Bloqueado';
    return prof.usuario ? 'Ativo' : 'Sem acesso';
  }

  getStatusClass(prof: EducadorListagemItem): string {
    if (!prof.ativo) return 'tag-status--inativo';
    if (prof.usuario?.bloqueado) return 'tag-status--bloqueado';
    return prof.usuario ? 'tag-status--ativo' : '';
  }

  getFotoUrl(nome: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(nome)}&background=EDE9FE&color=4F46E5&size=64`;
  }

  // ─── Exportação CSV ───────────────────────────────────────────────────────

  exportarCSV(): void {
    const professores = this.professores();
    if (professores.length === 0) return;

    const cabecalho = ['Nome', 'Matrícula', 'Turma(s)', 'Tipo', 'Status'];
    const linhas = professores.map((p) => [
      p.nome,
      p.matricula,
      this.getTurmaLabel(p),
      this.getTipoLabel(p.tipo),
      this.getStatusLabel(p),
    ]);

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `professores_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.auditoriaService.registrarDownload('PROFESSORES', 'CSV', this.buildDetalhes()).subscribe();
  }

  private buildDetalhes(): string {
    const filtros: string[] = [];
    if (this.termoBusca()) filtros.push(`busca="${this.termoBusca()}"`);
    if (this.filtroTipo()) filtros.push(`tipo=${this.filtroTipo()}`);
    if (this.filtroStatus()) filtros.push(`status=${this.filtroStatus()}`);
    return filtros.length > 0 ? filtros.join('; ') : 'sem filtros';
  }

  abrirModalCadastrarEducador() {
    alert('Funcionalidade de cadastro manual em desenvolvimento.');
  }

  onTermoBuscaTurmaChange(termo: string): void {
    this.termoBuscaTurma.set(termo);
    this.turmasPagina.set(1);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.importarCSVEducadores(file);
    }
    (event.target as HTMLInputElement).value = '';
  }

  importarCSVEducadores(arquivo: File) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    this.isImporting.set(true);
    this.importResult.set(null);

    this.http.post<any>(`${this.apiUrl}/importar-csv`, formData)
      .subscribe({
        next: (res) => {
          this.isImporting.set(false);
          this.importResult.set({
            sucesso: res.sucesso || 0,
            falhas: res.falhas || 0,
            erros: res.erros || []
          });
          this.dispararBusca();
        },
        error: (err) => {
          this.isImporting.set(false);
          alert('Erro ao importar CSV: ' + (err.error?.message || err.message));
        }
      });
  }

  fecharModalImport() {
    this.importResult.set(null);
  }

  private dispararBusca(): void { this.busca$.next(); }
}
