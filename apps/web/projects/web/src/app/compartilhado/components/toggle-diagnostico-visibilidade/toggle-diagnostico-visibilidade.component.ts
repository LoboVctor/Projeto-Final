import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DiagnosticoVisibilidadeService } from '../../services/diagnostico-visibilidade.service';

@Component({
  selector: 'app-toggle-diagnostico-visibilidade',
  templateUrl: './toggle-diagnostico-visibilidade.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleDiagnosticoVisibilidadeComponent {
  protected readonly diagVis = inject(DiagnosticoVisibilidadeService);
}
