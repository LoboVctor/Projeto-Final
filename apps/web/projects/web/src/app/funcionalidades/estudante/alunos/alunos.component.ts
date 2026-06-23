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
import { EstudantesService } from '../../../compartilhado/services/estudantes.service';
import { EstudoDeCasoDrawerComponent } from '../components/estudo-de-caso-drawer/estudo-de-caso-drawer.component';
import { AlunoModalComponent } from '../../../compartilhado/components/aluno-modal/aluno-modal.component';
import type {
  EstudanteListagemItem,
  PaginacaoResponse,
} from '../../../compartilhado/models/gerenciamento-alunos.model';
import type { AlunoModalData } from '../../../compartilhado/models/aluno-modal.model';

@Component({
  selector: 'app-alunos',
  standalone: true,
  imports: [CommonModule, FormsModule, EstudoDeCasoDrawerComponent, AlunoModalComponent],
  templateUrl: './alunos.component.html',
  styleUrls: ['./alunos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlunosComponent implements OnInit {
  private readonly estudantesService = inject(EstudantesService);
  private readonly destroyRef = inject(DestroyRef);

  // ─── Estado da listagem ───────────────────────────────────────
  resposta = signal<PaginacaoResponse<EstudanteListagemItem> | null>(null);
  loading = signal(false);
  erro = signal<string | null>(null);

  // ─── Filtros ──────────────────────────────────────────────────
  termoBusca = signal('');
  filtroDiagnostico = signal('');
  paginaAtual = signal(1);
  readonly limitePorPagina = 20;

  // ─── Stream de busca com debounce (RxJS para fluxo assíncrono) ─
  private readonly busca$ = new Subject<void>();

  // ─── Estado do drawer de Estudo de Caso ──────────────────────
  drawerAberto = signal(false);
  alunoParaOcorrencia = signal<EstudanteListagemItem | null>(null);

  // ─── Estado do menu sanduíche ─────────────────────────────────
  menuAbertoId = signal<string | null>(null);

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

  ngOnInit(): void {
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

  limparFiltros(): void {
    this.termoBusca.set('');
    this.filtroDiagnostico.set('');
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina);
    this.dispararBusca();
  }

  // ─── Menu Sanduíche ───────────────────────────────────────────

  toggleMenu(alunoId: string): void {
    this.menuAbertoId.update((atual) => (atual === alunoId ? null : alunoId));
  }

  fecharMenu(): void {
    this.menuAbertoId.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.fecharMenu();
  }

  // ─── Modal do Aluno ──────────────────────────────────────────

  abrirModalAluno(aluno: EstudanteListagemItem): void {
    this.fecharMenu();
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

  // ─── Estudo de Caso ───────────────────────────────────────────

  abrirDrawerOcorrencia(aluno: EstudanteListagemItem): void {
    this.fecharMenu();
    this.alunoParaOcorrencia.set(aluno);
    this.drawerAberto.set(true);
  }

  fecharDrawer(): void {
    this.drawerAberto.set(false);
    this.alunoParaOcorrencia.set(null);
  }

  onOcorrenciaSalva(_estudoCasoId: string): void {
    // Recarrega a lista para refletir qualquer mudança de estado
    this.dispararBusca();
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
