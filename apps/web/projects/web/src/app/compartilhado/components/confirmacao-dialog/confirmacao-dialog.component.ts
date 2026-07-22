import { Component, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { NgClass } from '@angular/common';
import { ConfirmacaoService } from '../../services/confirmacao.service';

@Component({
  selector: 'app-confirmacao-dialog',
  imports: [NgClass],
  templateUrl: './confirmacao-dialog.component.html',
  styleUrl: './confirmacao-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class ConfirmacaoDialogComponent {
  constructor(public confirmacaoService: ConfirmacaoService) {}

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.confirmacaoService.estado()) {
      this.confirmacaoService.cancelarAcao();
    }
  }

  confirmar(): void {
    this.confirmacaoService.confirmarAcao();
  }

  cancelar(): void {
    this.confirmacaoService.cancelarAcao();
  }
}
