import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TurmasService,
  TurmaResumo,
  EstudanteResumo,
  EstudantesPorTurmaResponse,
  MetricasTurma,
} from '../../../nucleo/services/turmas.service';
import { AuthService } from '../../../nucleo/services/auth';
import { DiagLabelPipe } from '../../../compartilhado/pipes/student.pipes';
import { CardAlunoComponent } from '../../../compartilhado/components/card-aluno/card-aluno';
import { AlunoModalData } from '../../../compartilhado/models/aluno-modal.model';
import { AlunoModalComponent } from '../../../compartilhado/components/aluno-modal/aluno-modal.component';
import { TurmaGraficosComponent } from '../../turma/components/turma-graficos/turma-graficos';

type ViewMode = 'grid' | 'list';

const DIAG_LABEL: Record<string, string> = {
  TEA: 'TEA', TDAH: 'TDAH', SINDROME_DOWN: 'Síndrome de Down',
  PARALISIA_CEREBRAL: 'Paralisia Cerebral', DEFICIENCIA_INTELECTUAL: 'Def. Intelectual',
  DEFICIENCIA_MULTIPLA: 'Def. Múltipla', OUTRO: 'Outro',
};

const FCOM_LABEL: Record<string, string> = { VERBAL: 'Verbal', NAO_VERBAL: 'Não Verbal' };

@Component({
  selector: 'app-coordenador-turmas',
  imports: [CommonModule, CardAlunoComponent, DiagLabelPipe, AlunoModalComponent, TurmaGraficosComponent],
  templateUrl: './coordenador-turmas.component.html',
  styleUrls: ['./coordenador-turmas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordenadorTurmasComponent implements OnInit {
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
  alunoEmDestaque = signal<AlunoModalData | null>(null);

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
    this.loading.set(true);
    // Coordenador vê TODAS as turmas (sem filtro por educadorId)
    this.turmasService.getTurmas().subscribe({
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

  setView(mode: ViewMode): void { this.viewMode.set(mode); }

  abrirDetalhesAluno(estudante: EstudanteResumo): void {
    const nomeDaTurma = this.turmaSelecionada()?.nome || 'Turma Indefinida';
    const diagnosticoPrincipal =
      estudante.diagnosticos.length > 0
        ? estudante.diagnosticos[0]?.diagnostico?.tipo || 'Sem Laudo'
        : 'Sem Laudo';

    this.alunoEmDestaque.set({
      id: estudante.id,
      nome: estudante.nomeCompleto,
      turma: nomeDaTurma,
      diagnostico: diagnosticoPrincipal,
      nivelSuporte: 'Nível 1 de Suporte',
      foto: estudante.foto || `https://ui-avatars.com/api/?name=${estudante.nomeCompleto}&background=F0E6FF&color=4A148C`,
    });
  }
}
