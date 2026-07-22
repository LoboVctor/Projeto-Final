import { Component, ChangeDetectionStrategy, signal, input } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

/**
 * ATENÇÃO (CÓDIGO POTENCIALMENTE MORTO):
 * Este modal parece ter sido substituído pela lógica inline no BlocoDashboardComponent.
 * Pode ser removido futuramente caso a abertura de gráficos por modal não seja mais utilizada.
 */
@Component({
  selector: 'app-dashboard-modal',
  imports: [MatDialogModule, MatButtonToggleModule],
  templateUrl: './dashboard-modal.component.html',
  styleUrls: ['./dashboard-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardModalComponent {
  dialogData: { name: string } = { name: 'Categoria' }; // Mock para tipagem
  periodo = signal<'semana' | 'mes' | 'semestre'>('semana');

  mudarPeriodo(valor: 'semana' | 'mes' | 'semestre') {
    this.periodo.set(valor);
  }
}
