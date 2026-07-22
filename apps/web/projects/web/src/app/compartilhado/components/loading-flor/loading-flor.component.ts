import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Componente de loading reutilizável com animação de girassol (flor).
 * Extraído de `alunos.component.html` para reaproveitamento em todos os
 * estados de carregamento do sistema.
 */
@Component({
  selector: 'app-loading-flor',
  templateUrl: './loading-flor.component.html',
  styleUrl: './loading-flor.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingFlorComponent {
  readonly titulo = input<string>('Carregando...');
  readonly subtitulo = input<string>('');
  /** Cor do ícone (SVG currentColor). Padrão: laranja girassol. */
  readonly cor = input<string>('#F97316');
}
