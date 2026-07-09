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
import { ActivatedRoute, Router } from '@angular/router';
import { EstudantesService } from '../../../compartilhado/services/estudantes.service';
import { AlunoModalComponent } from '../../../compartilhado/components/aluno-modal/aluno-modal.component';
import { TurmasService, TurmaResumo } from '../../../nucleo/services/turmas.service';
import type {
  EstudanteListagemItem,
  PaginacaoResponse,
} from '../../../compartilhado/models/gerenciamento-alunos.model';
import type { AlunoModalData } from '../../../compartilhado/models/aluno-modal.model';
import { DiagLabelPipe } from '../../../compartilhado/pipes/student.pipes';
import { AuditoriaService } from '../../../nucleo/services/auditoria.service';

@Component({
  selector: 'app-coordenador-alunos',
  standalone: true,
  imports: [CommonModule, FormsModule, AlunoModalComponent, DiagLabelPipe],
  templateUrl: './coordenador-alunos.component.html',
  styleUrls: ['./coordenador-alunos.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordenadorAlunosComponent implements OnInit {
  private readonly estudantesService = inject(EstudantesService);
  private readonly turmasService = inject(TurmasService);
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  abaSolicitada = signal<string | null>(null);
  resposta = signal<PaginacaoResponse<EstudanteListagemItem> | null>(null);
  loading = signal(false);
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
  readonly limitePorPagina = 20;

  turmasDisponiveis = signal<TurmaResumo[]>([]);

  private readonly busca$ = new Subject<void>();

  modalAlunoAberto = signal(false);
  modalAlunoData = signal<AlunoModalData | null>(null);

  readonly estudantes = computed(() => this.resposta()?.data ?? []);
  readonly total = computed(() => this.resposta()?.total ?? 0);
  readonly totalPaginas = computed(() => this.resposta()?.totalPaginas ?? 1);
  readonly temResultados = computed(() => this.estudantes().length > 0);

  readonly tiposDiagnostico = [
    'TEA',
    'TDAH',
    'SINDROME DOWN',
    'PARALISIA CEREBRAL',
    'DEFICIENCIA INTELECTUAL',
    'DEFICIENCIA MULTIPLA',
    'OUTRO',
  ];

  readonly categoriaEspecificidade = ['ALIMENTAR', 'SENSORIAL', 'MOTORA', 'COMPORTAMENTAL'];

  ngOnInit(): void {
    const statusUrl = this.route.snapshot.queryParams['status'];
    if (statusUrl) this.filtroStatus.set(statusUrl);

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

  getDiagnosticoLabel(aluno: EstudanteListagemItem): string {
    if (aluno.diagnosticos.length === 0) return '—';
    const mapa: Record<string, string> = {
      TEA: 'TEA', TDAH: 'TDAH', SINDROME_DOWN: 'S.Down',
      PARALISIA_CEREBRAL: 'P.Cerebral', DEFICIENCIA_INTELECTUAL: 'Def. Int.',
      DEFICIENCIA_MULTIPLA: 'Def. Múlt.', OUTRO: 'Outro',
    };
    return aluno.diagnosticos.map((d) => mapa[d.diagnostico.tipo] || d.diagnostico.tipo).join(', ');
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
      'OUTRO': 'bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]/40',
    };
    return mapaCores[diagnostico?.toUpperCase()] || 'bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]/40';
  }

  private dispararBusca(): void { this.busca$.next(); }
}
