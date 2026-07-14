import { Injectable, signal } from '@angular/core';
import { ConfirmacaoConfig, ConfirmacaoEstado } from '../models/confirmacao.model';

@Injectable({
  providedIn: 'root'
})
export class ConfirmacaoService {
  readonly estado = signal<ConfirmacaoEstado | null>(null);

  private resolver: ((valor: boolean) => void) | null = null;

  confirmar(config: ConfirmacaoConfig): Promise<boolean> {
    this.resolver?.(false);

    this.estado.set({
      titulo: config.titulo,
      mensagem: config.mensagem,
      textoConfirmar: config.textoConfirmar ?? 'Confirmar',
      textoCancelar: config.textoCancelar ?? 'Cancelar',
      variante: config.variante ?? 'default'
    });

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  confirmarAcao(): void {
    this.resolver?.(true);
    this.finalizar();
  }

  cancelarAcao(): void {
    this.resolver?.(false);
    this.finalizar();
  }

  private finalizar(): void {
    this.resolver = null;
    this.estado.set(null);
  }
}
