import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';

export type BigNumberCor = 'purple' | 'blue' | 'amber' | 'green';

export interface BigNumberCard {
  /** Conteúdo interno do <svg> (paths/rects/etc.) do ícone do card. */
  iconSvg: string;
  cor: BigNumberCor;
  label: string;
  valor: string | number | null;
  loading?: boolean;
  /** Usa fonte menor para valores textuais longos (ex: nome de diagnóstico). */
  pequeno?: boolean;
}

/**
 * Componente reutilizável de "Big Numbers" (cards com ícone + label + valor),
 * extraído da Home do Coordenador/Educador e Turmas para evitar duplicação
 * de markup entre as diferentes telas.
 */
@Component({
  selector: 'app-big-numbers',
  standalone: true,
  templateUrl: './big-numbers.component.html',
  styleUrl: './big-numbers.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BigNumbersComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly cards = input.required<BigNumberCard[]>();

  iconHtml(card: BigNumberCard): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(card.iconSvg);
  }
}
