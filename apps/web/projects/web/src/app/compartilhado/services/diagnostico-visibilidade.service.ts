import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DiagnosticoVisibilidadeService {
  /** Feature desativada: inicia sempre true (diagnóstico sempre visível). Ver toggle-diagnostico-visibilidade.component para reativar. */
  readonly visivel = signal(true);

  alternar(): void {
    this.visivel.update((v) => !v);
  }
}
