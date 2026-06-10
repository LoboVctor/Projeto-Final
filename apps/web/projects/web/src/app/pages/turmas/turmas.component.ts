import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraficoDiagnosticosComponent } from '../../features/turmas/components/grafico-diagnosticos/grafico-diagnosticos';

@Component({
  selector: 'app-turmas-page',
  standalone: true,
  imports: [CommonModule, GraficoDiagnosticosComponent],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-sora font-bold text-elo-roxo-profundo mb-6">Visão Geral da Turma</h1>
      
      <app-grafico-diagnosticos turmaId="123e4567-e89b-12d3-a456-426614174000"></app-grafico-diagnosticos>
    </div>
  `
})
export class TurmasComponent { }