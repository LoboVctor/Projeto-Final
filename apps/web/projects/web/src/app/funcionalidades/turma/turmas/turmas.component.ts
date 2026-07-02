import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurmasService, TurmaResumo, EstudanteResumo, EstudantesPorTurmaResponse, MetricasTurma } from '../../../nucleo/services/turmas.service';
import { AuthService } from '../../../nucleo/services/auth';
import { DiagLabelPipe } from '../../../compartilhado/pipes/student.pipes';
import { CardAlunoComponent } from '../../../compartilhado/components/card-aluno/card-aluno';
import { AlunoModalData } from '../../../compartilhado/models/aluno-modal.model';
import { AlunoModalComponent } from '../../../compartilhado/components/aluno-modal/aluno-modal.component';
import { TurmaGraficosComponent } from '../components/turma-graficos/turma-graficos';

type ViewMode = 'grid' | 'list';

/** Labels amigáveis para o diagnóstico principal */
const DIAG_LABEL: Record<string, string> = {
  TEA: 'TEA',
  TDAH: 'TDAH',
  SINDROME_DOWN: 'Síndrome de Down',
  PARALISIA_CEREBRAL: 'Paralisia Cerebral',
  DEFICIENCIA_INTELECTUAL: 'Def. Intelectual',
  DEFICIENCIA_MULTIPLA: 'Def. Múltipla',
  OUTRO: 'Outro',
};

/** Labels amigáveis para forma de comunicação */
const FCOM_LABEL: Record<string, string> = {
  VERBAL: 'Verbal',
  NAO_VERBAL: 'Não Verbal',
};

@Component({
  selector: 'app-turmas-page',
  imports: [
    CommonModule,
    CardAlunoComponent,
    DiagLabelPipe,
    AlunoModalComponent,
    TurmaGraficosComponent,
  ],
  templateUrl: './turmas.component.html',
  styleUrls: ['./turmas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurmasComponent implements OnInit {
  private readonly turmasService = inject(TurmasService);
  private readonly authService = inject(AuthService);

  turmas = signal<TurmaResumo[]>([]);
  estudantes = signal<EstudanteResumo[]>([]);
  turmaSelecionada = signal<TurmaResumo | null>(null);
  metricas = signal<MetricasTurma | null>(null);
  viewMode = signal<ViewMode>('grid');
  loading = signal(false);
  loadingEstudantes = signal(false);
  error = signal<string | null>(null);

  // ── Computed helpers para Big Numbers ─────────────────────────
  readonly diagnosticoPrincipalLabel = computed(() => {
    const d = this.metricas()?.diagnosticoPrincipal;
    return d ? (DIAG_LABEL[d] ?? d) : '—';
  });

  readonly comunicacaoPrincipalLabel = computed(() => {
    const c = this.metricas()?.comunicacaoPrincipal;
    return c ? (FCOM_LABEL[c] ?? c) : '—';
  });

  ngOnInit(): void {
    this.carregarTurmas();
  }

  carregarTurmas(): void {
    const educadorId = this.authService.getLoggedUserId() ?? undefined;
    this.loading.set(true);
    this.turmasService.getTurmas(educadorId).subscribe({
      next: (turmas) => {
        this.turmas.set(turmas);
        this.loading.set(false);
        if (turmas.length > 0 && turmas[0]) this.selecionarTurma(turmas[0]);
      },
      error: () => {
        this.error.set('Erro ao carregar turmas. Verifique a conexão com a API.');
        this.loading.set(false);
      },
    });
  }

  selecionarTurma(turma: TurmaResumo): void {
    if (this.turmaSelecionada()?.id === turma.id) return;
    this.turmaSelecionada.set(turma);
    this.loadingEstudantes.set(true);

    // Carrega estudantes e métricas em paralelo (sem bloquear um ao outro)
    this.turmasService.getEstudantesDaTurma(turma.id).subscribe({
      next: (res: EstudantesPorTurmaResponse) => {
        this.estudantes.set(res.estudantes);
        this.loadingEstudantes.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar estudantes.');
        this.loadingEstudantes.set(false);
      },
    });

    this.turmasService.obterMetricasTurma(turma.id).subscribe({
      next: (m) => this.metricas.set(m),
      error: () => this.metricas.set(null),
    });
  }

  setView(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  alunoEmDestaque = signal<AlunoModalData | null>(null);

  abrirDetalhesAluno(estudante: EstudanteResumo): void {
    const nomeDaTurma = this.turmaSelecionada()?.nome || 'Turma Indefinida';

    const diagnosticoPrincipal = estudante.diagnosticos.length > 0
      ? estudante.diagnosticos[0]?.diagnostico?.tipo || 'Sem Laudo'
      : 'Sem Laudo';

    const dadosParaModal: AlunoModalData = {
      id: estudante.id,
      nome: estudante.nomeCompleto,
      turma: nomeDaTurma,
      diagnostico: diagnosticoPrincipal,
      nivelSuporte: 'Nível 1 de Suporte',
      foto: estudante.foto || `https://ui-avatars.com/api/?name=${estudante.nomeCompleto}&background=F0E6FF&color=4A148C`,
    };

    this.alunoEmDestaque.set(dadosParaModal);
  }

  calcularIdade(dataNascimento: string | Date | undefined): number | undefined {
    if (!dataNascimento) return undefined;

    const hoje = new Date();
    const nascimento = new Date(dataNascimento);

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }

    return idade;
  }
}
