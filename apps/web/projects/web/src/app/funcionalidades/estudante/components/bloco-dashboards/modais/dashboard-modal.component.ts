import { Component, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

/**
 * ATENÇÃO (CÓDIGO POTENCIALMENTE MORTO):
 * Este modal parece ter sido substituído pela lógica inline no BlocoDashboardComponent.
 * Pode ser removido futuramente caso a abertura de gráficos por modal não seja mais utilizada.
 */
@Component({
  selector: 'app-dashboard-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonToggleModule],
  templateUrl: './dashboard-modal.component.html',
  styleUrls: ['./dashboard-modal.component.css']
})
export class DashboardModalComponent {
  // @ts-ignore
  dialogData: any = { name: 'Categoria' }; // Mock para tipagem
  periodo = signal<'semana' | 'mes' | 'semestre'>('semana');

  mudarPeriodo(valor: 'semana' | 'mes' | 'semestre') {
    this.periodo.set(valor);
  }
}
