import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { EstudantesService } from '../../../compartilhado/services/estudantes.service';
import { AlunoModalComponent } from '../../../compartilhado/components/aluno-modal/aluno-modal.component';
import { TurmasService, TurmaResumo } from '../../../nucleo/services/turmas.service';
import type {
  EstudanteListagemItem,
  PaginacaoResponse,
} from '../../../compartilhado/models/gerenciamento-alunos.model';
import type { AlunoModalData } from '../../../compartilhado/models/aluno-modal.model';
import { DiagLabelPipe, DiagColorPipe } from '../../../compartilhado/pipes/student.pipes';
import { AuditoriaService } from '../../../nucleo/services/auditoria.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../nucleo/config/api.config';
import { finalize } from 'rxjs';
import { LoadingFlorComponent } from '../../../compartilhado/components/loading-flor/loading-flor.component';
import { ModalCadastrarAlunoComponent } from './components/modal-cadastrar-aluno/modal-cadastrar-aluno.component';
import { buildAlunoModalData, buildFotoUrl } from '../../../compartilhado/utils/aluno-modal.utils';

@Component({
  selector: 'app-coordenador-alunos',
  standalone: true,
  imports: [CommonModule, FormsModule, AlunoModalComponent, DiagLabelPipe, DiagColorPipe, LoadingFlorComponent, ModalCadastrarAlunoComponent],
  templateUrl: './coordenador-alunos.component.html',
  styleUrls: ['./coordenador-alunos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordenadorAlunosComponent implements OnInit {
  private readonly estudantesService = inject(EstudantesService);
  private readonly turmasService = inject(TurmasService);
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  abaSolicitada = signal<string | null>(null);
  dropdownCadastrarAberto = signal(false);
  menuAbertoId = signal<string | null>(null);

  toggleDropdownCadastrar(event: Event): void {
    event.stopPropagation();
    this.dropdownCadastrarAberto.set(!this.dropdownCadastrarAberto());
  }

  toggleMenu(id: string, event: Event): void {
    event.stopPropagation();
    this.menuAbertoId.update(current => current === id ? null : id);
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.fecharMenus();
  }

  fecharMenus(): void {
    this.dropdownCadastrarAberto.set(false);
    this.menuAbertoId.set(null);
  }

  // --- Modal Cadastro Manual ---
  modalCadastrarAlunoAberto = signal(false);

  fecharModalCadastrarAluno(): void {
    this.modalCadastrarAlunoAberto.set(false);
  }

  onAlunoCadastrado(): void {
    this.dispararBusca();
  }

  baixarModeloCSV(): void {
    const cabecalho = 'nome,matricula,cpf,data_nascimento,sexo,forma_comunicacao\n';
    const exemplo = 'Pedro da Silva,2023001,11122233344,2015-05-20,MASCULINO,VERBAL\n';
    const blob = new Blob([cabecalho + exemplo], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_alunos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  resposta = signal<PaginacaoResponse<EstudanteListagemItem> | null>(null);
  loading = signal(true);
  erro = signal<string | null>(null);

  termoBusca = signal('');
  filtroDiagnostico = signal('');
  filtroStatus = signal<'PENDENTE' | 'CONCLUIDO' | undefined>(undefined);
  filtroSexo = signal('');
  filtroTurmaId = signal('');
  filtroFormaComunicacao = signal('');
  filtroCategoria = signal('');
  filtroIdadeMin = signal<number | undefined>(undefined);
  filtroIdadeMax = signal<number | undefined>(undefined);
  paginaAtual = signal(1);
  readonly limitePorPagina = 6;

  turmasDisponiveis = signal<TurmaResumo[]>([]);

  private readonly busca$ = new Subject<void>();

  modalAlunoAberto = signal(false);
  modalAlunoData = signal<AlunoModalData | null>(null);

  readonly estudantes = computed(() => this.resposta()?.data ?? []);
  readonly total = computed(() => this.resposta()?.total ?? 0);
  readonly totalPaginas = computed(() => this.resposta()?.totalPaginas ?? 1);
  readonly temResultados = computed(() => this.estudantes().length > 0);

  readonly tiposDiagnostico = [
    'TDAH',
    'AUTISMO',
    'DISLEXIA',
    'SINDROME_DE_DOWN',
    'DEFICIENCIA_INTELECTUAL',
    'OUTRO',
  ];

  isImporting = signal(false);
  importResult = signal<{ sucesso: number; falhas: number; erros: string[] } | null>(null);

  readonly categoriaEspecificidade = ['ALIMENTAR', 'SENSORIAL', 'MOTORA', 'COMPORTAMENTAL'];

  ngOnInit(): void {
    const statusUrl = this.route.snapshot.queryParams['status'];
    if (statusUrl) this.filtroStatus.set(statusUrl);

    // Ação rápida da Home: se vier com ?abrirModal=true, abre o modal de cadastro direto
    if (this.route.snapshot.queryParams['abrirModal'] === 'true') {
      this.modalCadastrarAlunoAberto.set(true);
    }

    this.turmasService.getTurmas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (turmas) => this.turmasDisponiveis.set(turmas),
    });

    this.busca$
      .pipe(
        debounceTime(400),
        switchMap(() => {
          this.loading.set(true);
          this.erro.set(null);
          const termo = this.termoBusca().trim();
          const isMatricula = termo.length > 0 && /^\d+$/.test(termo);
          return this.estudantesService.buscarTodos({
            nome: !isMatricula && termo ? termo : undefined,
            matricula: isMatricula ? termo : undefined,
            diagnosticoTipo: this.filtroDiagnostico() || undefined,
            status: this.filtroStatus() || undefined,
            sexo: this.filtroSexo() || undefined,
            turmaId: this.filtroTurmaId() || undefined,
            formaComunicacao: this.filtroFormaComunicacao() || undefined,
            categoriaEspecificidade: this.filtroCategoria() || undefined,
            idadeMin: this.filtroIdadeMin(),
            idadeMax: this.filtroIdadeMax(),
            page: this.paginaAtual(),
            limit: this.limitePorPagina,
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.resposta.set(res);
          this.loading.set(false);
        },
        error: () => {
          this.erro.set('Erro ao carregar estudantes. Verifique a conexão com a API.');
          this.loading.set(false);
        },
      });

    this.dispararBusca();

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const estudanteId = params['estudante'];
      const aba = params['agenda'];
      if (estudanteId && aba) {
        const alunoEncontrado = this.estudantes().find((e) => e.id === estudanteId);
        if (alunoEncontrado) {
          this.abaSolicitada.set(aba);
          this.abrirModalAluno(alunoEncontrado);
        }
        this.router.navigate([], {
          queryParams: { estudante: null, agenda: null, data: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  onTermoBuscaChange(valor: string): void { this.termoBusca.set(valor); this.paginaAtual.set(1); this.dispararBusca(); }
  onFiltroDiagnosticoChange(tipo: string): void { this.filtroDiagnostico.set(tipo); this.paginaAtual.set(1); this.dispararBusca(); }
  onFiltroStatusChange(status: string): void { this.filtroStatus.set(status as 'PENDENTE' | 'CONCLUIDO' | undefined); this.paginaAtual.set(1); this.dispararBusca(); }
  onFiltroSexoChange(sexo: string): void { this.filtroSexo.set(sexo); this.paginaAtual.set(1); this.dispararBusca(); }
  onFiltroTurmaChange(turmaId: string): void { this.filtroTurmaId.set(turmaId); this.paginaAtual.set(1); this.dispararBusca(); }
  onFiltroFormaComunicacaoChange(forma: string): void { this.filtroFormaComunicacao.set(forma); this.paginaAtual.set(1); this.dispararBusca(); }
  onFiltroCategoriaChange(categoria: string): void { this.filtroCategoria.set(categoria); this.paginaAtual.set(1); this.dispararBusca(); }

  onFiltroIdadeMinChange(valor: string): void {
    const num = valor ? parseInt(valor, 10) : undefined;
    this.filtroIdadeMin.set(isNaN(num as number) ? undefined : num);
    this.paginaAtual.set(1); this.dispararBusca();
  }

  onFiltroIdadeMaxChange(valor: string): void {
    const num = valor ? parseInt(valor, 10) : undefined;
    this.filtroIdadeMax.set(isNaN(num as number) ? undefined : num);
    this.paginaAtual.set(1); this.dispararBusca();
  }

  limparFiltros(): void {
    this.termoBusca.set(''); this.filtroDiagnostico.set(''); this.filtroSexo.set('');
    this.filtroTurmaId.set(''); this.filtroFormaComunicacao.set(''); this.filtroCategoria.set('');
    this.filtroIdadeMin.set(undefined); this.filtroIdadeMax.set(undefined);
    this.paginaAtual.set(1); this.dispararBusca();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina); this.dispararBusca();
  }

  abrirModalAluno(aluno: EstudanteListagemItem): void {
    this.modalAlunoData.set(this.paraAlunoModalData(aluno));
    this.modalAlunoAberto.set(true);
  }

  fecharModalAluno(houveModificacao: boolean = false): void {
    this.modalAlunoAberto.set(false);
    this.modalAlunoData.set(null);
    if (houveModificacao) {
      this.dispararBusca(); // Atualiza a listagem se houver mudanças no modal
    }
  }

  private paraAlunoModalData(aluno: EstudanteListagemItem): AlunoModalData {
    return buildAlunoModalData(aluno, this.baseUrl);
  }

  exportarCSV(): void {
    const alunos = this.estudantes();
    if (alunos.length === 0) return;
    const cabecalho = ['Nome', 'Matrícula', 'Turma', 'Diagnóstico', 'Status'];
    const linhas = alunos.map((a) => [
      a.nomeCompleto, a.matricula,
      a.turmas.map((t) => t.nome).join(' / ') || '—',
      a.diagnosticos.map((d) => d.diagnostico.tipo).join(', ') || '—',
      a.statusMatricula,
    ]);
    const csv = [cabecalho, ...linhas].map((l) => l.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alunos_coordenador_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.auditoriaService.registrarDownload('ALUNOS_COORDENADOR', 'CSV', this.buildDetalhes()).subscribe();
  }

  private buildDetalhes(): string {
    const filtros: string[] = [];
    if (this.termoBusca()) filtros.push(`busca="${this.termoBusca()}"`);
    if (this.filtroDiagnostico()) filtros.push(`diagnostico=${this.filtroDiagnostico()}`);
    if (this.filtroStatus() !== undefined) filtros.push(`status=${this.filtroStatus()}`);
    if (this.filtroSexo()) filtros.push(`sexo=${this.filtroSexo()}`);
    if (this.filtroTurmaId()) filtros.push(`turmaId=${this.filtroTurmaId()}`);
    if (this.filtroIdadeMin() !== undefined) filtros.push(`idadeMin=${this.filtroIdadeMin()}`);
    if (this.filtroIdadeMax() !== undefined) filtros.push(`idadeMax=${this.filtroIdadeMax()}`);
    return filtros.length > 0 ? filtros.join('; ') : 'sem filtros';
  }

  getStatusLabel(aluno: EstudanteListagemItem): string { return aluno.statusMatricula ? 'ATIVO' : 'INATIVO'; }

  /** Usado na coluna "Turma" da tabela. */
  getTurmaLabel(aluno: EstudanteListagemItem): string {
    if (!aluno.turmas || aluno.turmas.length === 0) return '—';
    return aluno.turmas.map((t) => t.nome).join(' / ');
  }

  /** Usado na coluna "Aluno" da tabela (avatar). */
  getFotoUrl(aluno: EstudanteListagemItem): string {
    return buildFotoUrl(aluno.nomeCompleto, aluno.foto, this.baseUrl);
  }

  private dispararBusca(): void {
    this.busca$.next();
  }

  // ──────────────── EXCLUSÃO ────────────────
  modalConfirmacaoAberto = signal(false);
  alunoParaDesativar = signal<EstudanteListagemItem | null>(null);
  desativarLoading = signal(false);

  confirmarDesativacao(aluno: EstudanteListagemItem) {
    this.alunoParaDesativar.set(aluno);
    this.modalConfirmacaoAberto.set(true);
  }

  fecharModalConfirmacao(): void {
    this.modalConfirmacaoAberto.set(false);
    this.alunoParaDesativar.set(null);
  }

  executarDesativacao() {
    const aluno = this.alunoParaDesativar();
    if (!aluno) return;
    
    this.desativarLoading.set(true);
    this.estudantesService.desativarEstudante(aluno.id).subscribe({
      next: () => {
        this.desativarLoading.set(false);
        this.fecharModalConfirmacao();
        this.dispararBusca();
      },
      error: (err) => {
        console.error('Erro ao desativar aluno:', err);
        this.desativarLoading.set(false);
        this.erro.set('Erro ao desativar aluno. Tente novamente mais tarde.');
        this.fecharModalConfirmacao();
      }
    });
  }

  abrirModalCadastrarAluno(): void {
    this.fecharMenus();
    this.modalCadastrarAlunoAberto.set(true);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.importarCSV(file);
    }
    // reset file input
    (event.target as HTMLInputElement).value = '';
  }

  importarCSV(arquivo: File) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    this.isImporting.set(true);
    this.importResult.set(null);

    this.http.post<any>(`${this.baseUrl}/estudantes/importar-csv`, formData)
      .pipe(finalize(() => this.isImporting.set(false)))
      .subscribe({
        next: (res) => {
          this.importResult.set({
            sucesso: res.sucesso || 0,
            falhas: res.falhas || 0,
            erros: res.erros || []
          });
          this.dispararBusca();
        },
        error: (err) => {
          alert('Erro ao importar CSV: ' + (err.error?.message || err.message));
        }
      });
  }

  fecharModalImport() {
    this.importResult.set(null);
  }
}

