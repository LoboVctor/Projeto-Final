import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurmasService, TurmaResumo, EstudanteResumo, EstudantesPorTurmaResponse } from '../../core/services/turmas.service';
import { AuthService } from '../../core/services/auth';
import { StudentCardComponent } from './components/student-card/student-card.component';
import { DiagLabelPipe } from '../../shared/pipes/student.pipes';
import { GraficoDiagnosticosComponent } from '../../features/turmas/components/grafico-diagnosticos/grafico-diagnosticos';

type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-turmas-page',
  standalone: true,
  // CR-11: NgFor, NgIf e SlicePipe já estão incluídos no CommonModule — removidos os imports duplicados
  imports: [
    CommonModule,
    StudentCardComponent,
    DiagLabelPipe,
    GraficoDiagnosticosComponent,
  ],
  templateUrl: './turmas.component.html',
  styleUrls: ['./turmas.component.css'],
})
export class TurmasComponent implements OnInit {
  private readonly turmasService = inject(TurmasService);
  private readonly authService = inject(AuthService);

  turmas = signal<TurmaResumo[]>([]);
  estudantes = signal<EstudanteResumo[]>([]);
  turmaSelecionada = signal<TurmaResumo | null>(null);
  viewMode = signal<ViewMode>('grid');
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.carregarTurmas();
  }

  carregarTurmas(): void {
    // CR-06: filtra as turmas pelo educador autenticado via AuthService
    const educadorId = this.authService.getLoggedUserId() ?? undefined;
    this.loading.set(true);
    this.turmasService.getTurmas(educadorId).subscribe({
      next: (turmas) => {
        this.turmas.set(turmas);
        this.loading.set(false);
        // Se houver turmas, carrega automaticamente a primeira
        if (turmas.length > 0) this.selecionarTurma(turmas[0]);
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
    this.loading.set(true);
    this.turmasService.getEstudantesDaTurma(turma.id).subscribe({
      next: (res: EstudantesPorTurmaResponse) => {
        this.estudantes.set(res.estudantes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar estudantes.');
        this.loading.set(false);
      },
    });
  }

  setView(mode: ViewMode): void {
    this.viewMode.set(mode);
  }
}
