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
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { EstudantesService } from '../../../compartilhado/services/estudantes.service';
import { AlunoModalComponent } from '../../../compartilhado/components/aluno-modal/aluno-modal.component';
import { TurmasService, TurmaResumo } from '../../../nucleo/services/turmas.service';
import type {
  EstudanteListagemItem,
  PaginacaoResponse,
} from '../../../compartilhado/models/gerenciamento-alunos.model';
import type { AlunoModalData } from '../../../compartilhado/models/aluno-modal.model';

@Component({
  selector: 'app-alunos',
  standalone: true,
  imports: [CommonModule, FormsModule, AlunoModalComponent],
  templateUrl: './alunos.component.html',
  styleUrls: ['./alunos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlunosComponent implements OnInit {
  private readonly estudantesService = inject(EstudantesService);
  private readonly turmasService = inject(TurmasService);
  private readonly destroyRef = inject(DestroyRef);

  // ─── Estado da listagem ───────────────────────────────────────
  resposta = signal<PaginacaoResponse<EstudanteListagemItem> | null>(null);
  loading = signal(false);
  erro = signal<string | null>(null);

  // ─── Filtros ──────────────────────────────────────────────────
  termoBusca = signal('');
  filtroDiagnostico = signal('');
  filtroSexo = signal('');
  filtroTurmaId = signal('');
  filtroFormaComunicacao = signal('');
  filtroCategoria = signal('');
  filtroIdadeMin = signal<number | undefined>(undefined);
  filtroIdadeMax = signal<number | undefined>(undefined);
  paginaAtual = signal(1);
  readonly limitePorPagina = 20;

  // ─── Turmas disponíveis (para o filtro de turma) ──────────────
  turmasDisponiveis = signal<TurmaResumo[]>([]);

  // ─── Stream de busca com debounce (RxJS para fluxo assíncrono) ─
  private readonly busca$ = new Subject<void>();

  // ─── Estado do modal do aluno ─────────────────────────────────
  modalAlunoAberto = signal(false);
  modalAlunoData = signal<AlunoModalData | null>(null);

  // ─── Computed helpers ─────────────────────────────────────────
  readonly estudantes = computed(() => this.resposta()?.data ?? []);
  readonly total = computed(() => this.resposta()?.total ?? 0);
  readonly totalPaginas = computed(() => this.resposta()?.totalPaginas ?? 1);
  readonly temResultados = computed(() => this.estudantes().length > 0);

  /** Valores exatos do enum TipoDiagnostico do schema Prisma */
  readonly tiposDiagnostico = [
    'TEA',
    'TDAH',
    'SINDROME_DOWN',
    'PARALISIA_CEREBRAL',
    'DEFICIENCIA_INTELECTUAL',
    'DEFICIENCIA_MULTIPLA',
    'OUTRO',
  ];

  readonly categoriaEspecificidade = [
    'ALIMENTAR',
    'SENSORIAL',
    'MOTORA',
    'COMPORTAMENTAL',
  ];

  ngOnInit(): void {
    // Carrega lista de turmas para o filtro
    this.turmasService.getTurmas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (turmas) => this.turmasDisponiveis.set(turmas),
    });

    // Configura a stream de busca com debounce de 400ms
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

    // Dispara a busca inicial
    this.dispararBusca();
  }

  onTermoBuscaChange(valor: string): void {
    this.termoBusca.set(valor);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  onFiltroDiagnosticoChange(tipo: string): void {
    this.filtroDiagnostico.set(tipo);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  onFiltroSexoChange(sexo: string): void {
    this.filtroSexo.set(sexo);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  onFiltroTurmaChange(turmaId: string): void {
    this.filtroTurmaId.set(turmaId);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  onFiltroFormaComunicacaoChange(forma: string): void {
    this.filtroFormaComunicacao.set(forma);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  onFiltroCategoriaChange(categoria: string): void {
    this.filtroCategoria.set(categoria);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  onFiltroIdadeMinChange(valor: string): void {
    const num = valor ? parseInt(valor, 10) : undefined;
    this.filtroIdadeMin.set(isNaN(num as number) ? undefined : num);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  onFiltroIdadeMaxChange(valor: string): void {
    const num = valor ? parseInt(valor, 10) : undefined;
    this.filtroIdadeMax.set(isNaN(num as number) ? undefined : num);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  limparFiltros(): void {
    this.termoBusca.set('');
    this.filtroDiagnostico.set('');
    this.filtroSexo.set('');
    this.filtroTurmaId.set('');
    this.filtroFormaComunicacao.set('');
    this.filtroCategoria.set('');
    this.filtroIdadeMin.set(undefined);
    this.filtroIdadeMax.set(undefined);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina);
    this.dispararBusca();
  }

  // ─── Modal do Aluno ──────────────────────────────────────────

  abrirModalAluno(aluno: EstudanteListagemItem): void {
    this.modalAlunoData.set(this.paraAlunoModalData(aluno));
    this.modalAlunoAberto.set(true);
  }

  fecharModalAluno(): void {
    this.modalAlunoAberto.set(false);
    this.modalAlunoData.set(null);
  }

  private paraAlunoModalData(aluno: EstudanteListagemItem): AlunoModalData {
    return {
      id: aluno.id,
      nome: aluno.nomeCompleto,
      turma: this.getTurmaLabel(aluno),
      diagnostico: this.getDiagnosticoLabel(aluno),
      nivelSuporte: '',
      foto: aluno.foto ?? undefined,
    };
  }

  // ─── Exportação CSV ───────────────────────────────────────────

  exportarCSV(): void {
    const alunos = this.estudantes();
    if (alunos.length === 0) return;

    const cabecalho = ['Nome', 'Matrícula', 'Turma', 'Diagnóstico', 'Status'];
    const linhas = alunos.map((a) => [
      a.nomeCompleto,
      a.matricula,
      a.turmas.map((t) => t.nome).join(' / ') || '—',
      a.diagnosticos.map((d) => d.diagnostico.tipo).join(', ') || '—',
      a.statusMatricula,
    ]);

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((cel) => `"${cel}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `alunos_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ─── Helpers de template ──────────────────────────────────────

  getStatusLabel(aluno: EstudanteListagemItem): string {
    return aluno.statusMatricula ? 'ATIVO' : 'INATIVO';
  }

  getDiagnosticoLabel(aluno: EstudanteListagemItem): string {
    if (aluno.diagnosticos.length === 0) return '—';
    return aluno.diagnosticos.map((d) => d.diagnostico.tipo).join(', ');
  }

  getTurmaLabel(aluno: EstudanteListagemItem): string {
    if (aluno.turmas.length === 0) return '—';
    return aluno.turmas.map((t) => t.nome).join(' / ');
  }

  getFotoUrl(aluno: EstudanteListagemItem): string {
    return (
      aluno.foto ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(aluno.nomeCompleto)}&background=EDE9FE&color=4F46E5&size=64`
    );
  }

  private dispararBusca(): void {
    this.busca$.next();
  }
}
