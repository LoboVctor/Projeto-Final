import { Pipe, PipeTransform } from '@angular/core';

/** Exibe "João F." a partir de "João Ferreira da Silva" */
@Pipe({ name: 'shortName' })
export class ShortNamePipe implements PipeTransform {
  transform(value: string): string {
    const parts = value.trim().split(/\s+/);
    if (parts.length === 1) return parts[0] || '';
    return `${parts[0]} ${parts[parts.length - 1]?.[0] || ''}.`;
  }
}

/** Converte o enum TipoDiagnostico para label exibível */
@Pipe({ name: 'diagLabel' })
export class DiagLabelPipe implements PipeTransform {
  private readonly map: Record<string, string> = {
    TEA: 'TEA',
    TDAH: 'TDAH',
    SINDROME_DOWN: 'S.Down',
    PARALISIA_CEREBRAL: 'P.Cerebral',
    DEFICIENCIA_INTELECTUAL: 'Def. Int.',
    DEFICIENCIA_MULTIPLA: 'Def. Múlt.',
    OUTRO: 'Outro' };

  transform(value: string): string {
    return this.map[value] ?? value;
  }
}
