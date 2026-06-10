import { Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf, SlicePipe } from '@angular/common';
import { TurmasService, TurmaResumo, EstudanteResumo, EstudantesPorTurmaResponse } from '../../core/services/turmas.service';
import { StudentCardComponent } from './components/student-card/student-card.component';
import { DiagLabelPipe } from '../../shared/pipes/student.pipes';

type ViewMode = 'grid' | 'list';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraficoDiagnosticosComponent } from '../../features/turmas/components/grafico-diagnosticos/grafico-diagnosticos';

@Component({
  selector: 'app-turmas-page',
  standalone: true,
  imports: [NgFor, NgIf, SlicePipe, StudentCardComponent, DiagLabelPipe],
  templateUrl: './turmas.component.html',
  styleUrls: ['./turmas.component.css'],
})
export class TurmasComponent implements OnInit {
  private readonly turmasService = inject(TurmasService);

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
    this.loading.set(true);
    // TODO: substituir pelo educadorId do usuário autenticado via AuthService
    this.turmasService.getTurmas().subscribe({
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
  imports: [CommonModule, GraficoDiagnosticosComponent],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-sora font-bold text-elo-roxo-profundo mb-6">Visão Geral da Turma</h1>
      
      <app-grafico-diagnosticos turmaId="123e4567-e89b-12d3-a456-426614174000"></app-grafico-diagnosticos>
    </div>
  `
})
export class TurmasComponent { }
