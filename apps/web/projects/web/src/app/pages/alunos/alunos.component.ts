import { Component } from '@angular/core';
import { BlocoSaudeComponent } from '../../features/estudantes/components/bloco-saude/bloco-saude';
import { BlocoRelatoriosComponent } from '../../features/estudantes/components/bloco-relatorios/bloco-relatorios';

@Component({
  selector: 'app-alunos',
  standalone: true,
  imports: [BlocoSaudeComponent, BlocoRelatoriosComponent],
  template: `
    <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
      <h1 class="text-2xl font-bold mb-6" style="color: #1e293b; margin-bottom: 1.5rem;">
        Painel do Estudante
      </h1>

      <!-- Bloco 2: Saúde -->
      <app-bloco-saude [estudanteId]="'33333333-3333-3333-3333-333333333333'"></app-bloco-saude>

      <!-- Bloco 3: Relatórios (Metas + PIBI) -->
      <app-bloco-relatorios [estudanteId]="'33333333-3333-3333-3333-333333333333'"></app-bloco-relatorios>
    </div>
  `
})
export class AlunosComponent {}

