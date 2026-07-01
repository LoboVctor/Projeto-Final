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

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  abaSolicitada = signal<string | null>(null);
  // ─── Estado da listagem ───────────────────────────────────────
  resposta = signal<PaginacaoResponse<EstudanteListagemItem> | null>(null);
  loading = signal(false);
  erro = signal<string | null>(null);

  // ─── Filtros ──────────────────────────────────────────────────
  termoBusca = signal('');
  filtroDiagnostico = signal('');
  filtroStatus = signal<'PENDENTE' | 'CONCLUIDO' | undefined>(undefined);
  paginaAtual = signal(1);
  readonly limitePorPagina = 20;

  // ─── Stream de busca com debounce (RxJS para fluxo assíncrono) ─
  private readonly busca$ = new Subject<void>();

  // ─── Estado do drawer de Estudo de Caso ──────────────────────
  drawerAberto = signal(false);
  alunoParaOcorrencia = signal<EstudanteListagemItem | null>(null);

  // ─── Estado do menu sanduíche ─────────────────────────────────
  menuAbertoId = signal<string | null>(null);
  /** Coordenadas absolutas (viewport) do dropdown — permite usar position:fixed
   *  e escapar do overflow:hidden da tabela. */
  menuPosicao = signal<{ top: number; left: number } | null>(null);

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
    'SINDROME DOWN',
    'PARALISIA CEREBRAL',
    'DEFICIENCIA INTELECTUAL',
    'DEFICIENCIA MULTIPLA',
    'OUTRO',
  ];

  ngOnInit(): void {

    const statusUrl = this.route.snapshot.queryParams['status'];
      if (statusUrl) {
        this.filtroStatus.set(statusUrl);
      }
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
            status: this.filtroStatus() || undefined,
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

    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
    const estudanteId = params['estudante'];
    const aba = params['agenda']; // 'agenda' ou 'registros-diarios'

    if (estudanteId && aba) {
      // Busca o aluno no signal de estudantes baseado no ID
      const alunoEncontrado = this.estudantes().find(e => e.id === estudanteId);
      
      if (alunoEncontrado) {
        this.abaSolicitada.set(aba);
        this.abrirModalAluno(alunoEncontrado);
      }
      
      // Limpa a URL para não reabrir o modal em um F5
      this.router.navigate([], {
        queryParams: { estudante: null, agenda: null, data: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  });
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

  onFiltroStatusChange(status: string): void {
    this.filtroStatus.set(status as 'PENDENTE' | 'CONCLUIDO' | undefined);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  limparFiltros(): void {
    this.termoBusca.set('');
    this.filtroDiagnostico.set('');
    this.filtroStatus.set(undefined);
    this.paginaAtual.set(1);
    this.dispararBusca();
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina);
    this.dispararBusca();
  }

  // ─── Menu Sanduíche ───────────────────────────────────────────

  toggleMenu(alunoId: string, event: MouseEvent): void {
    if (this.menuAbertoId() === alunoId) {
      this.menuAbertoId.set(null);
      this.menuPosicao.set(null);
      return;
    }
    const btn = event.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    this.menuAbertoId.set(alunoId);
    this.menuPosicao.set({
      top: rect.bottom + 6,
      left: rect.right - 190, // 190px = min-width do dropdown
    });
  }

  fecharMenu(): void {
    this.menuAbertoId.set(null);
    this.menuPosicao.set(null);
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
      .map((linha) => linha.join(','))
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

  // Mapeamento dinâmico de cores para a listagem da tabela
  getCorDiagnostico(diagnostico: string): string {
    const mapaCores: Record<string, string> = {
      'TEA': 'bg-[#F3E8FF] text-[#6C3CC9] border-[#B79CED]/40',
      'TDAH': 'bg-[#E0F2FE] text-[#0369A1] border-[#7DD3FC]/40',
      'SINDROME DOWN': 'bg-[#E6F4EA] text-[#137333] border-[#82CBA2]/40',
      'SINDROME_DOWN': 'bg-[#E6F4EA] text-[#137333] border-[#82CBA2]/40',
      'PARALISIA CEREBRAL': 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]/40',
      'PARALISIA_CEREBRAL': 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]/40',
      'DEFICIENCIA INTELECTUAL': 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]/40',
      'DEFICIENCIA_INTELECTUAL': 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]/40',
      'DEFICIENCIA MULTIPLA': 'bg-[#FCE7F3] text-[#9D174D] border-[#FBCFE8]/40',
      'DEFICIENCIA_MULTIPLA': 'bg-[#FCE7F3] text-[#9D174D] border-[#FBCFE8]/40',
      'TOD': 'bg-[#FFEDD5] text-[#C2410C] border-[#FDBA74]/40',
      'OUTRO': 'bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]/40'
    };

    return mapaCores[diagnostico?.toUpperCase()] || 'bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]/40';
  }

  private dispararBusca(): void {
    this.busca$.next();
  }

  
}