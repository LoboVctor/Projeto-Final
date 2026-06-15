import { Component } from '@angular/core';
import { BlocoSaudeComponent } from '../../features/estudantes/components/bloco-saude/bloco-saude';

@Component({
  selector: 'app-alunos',
  standalone: true,
  imports: [BlocoSaudeComponent],
  template: `
    <div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
      <h1 class="text-2xl font-bold mb-6" style="color: #1e293b; margin-bottom: 1.5rem;">
        Painel do Estudante
      </h1>
      
      <app-bloco-saude [estudanteId]="'33333333-3333-3333-3333-333333333333'"></app-bloco-saude>
    </div>
  `
})
export class AlunosComponent {}
