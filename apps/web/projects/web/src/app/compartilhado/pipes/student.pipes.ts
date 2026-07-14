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
    SINDROME_DOWN: 'S.DOWN',
    PARALISIA_CEREBRAL: 'PC',
    DEFICIENCIA_INTELECTUAL: 'DI',
    DEFICIENCIA_MULTIPLA: 'DEMU',
    OUTRO: 'OUTRO'
  };

  transform(value: string): string {
    return this.map[value] || value;
  }
}

/** Converte o enum TipoDiagnostico para as classes CSS de cor correspondentes */
@Pipe({ name: 'diagColor' })
export class DiagColorPipe implements PipeTransform {
  private readonly mapaCores: Record<string, string> = {
    'TEA': 'bg-[#F3E8FF] text-[#6C3CC9] border-[#B79CED]/40',
    'TDAH': 'bg-[#E0F2FE] text-[#0369A1] border-[#7DD3FC]/40',
    'SINDROME DOWN': 'bg-[#E6F4EA] text-[#137333] border-[#82CBA2]/40',
    'SINDROME_DOWN': 'bg-[#E6F4EA] text-[#137333] border-[#82CBA2]/40',
    'PARALISIA CEREBRAL': 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]/40',
    'PARALISIA_CEREBRAL': 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]/40',
    'DEFICIENCIA INTELECTUAL': 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]/40',
    'DEFICIENCIA_INTELECTUAL': 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]/40',
    'DEFICIENCIA MULTIPLA': 'bg-[#FCE7F3] text-[#9D174D] border-[#FBCFE8]/40',
    'DEFICIENCIA_MULTIPLA': 'bg-[#FCE7F3] text-[#9D174D] border-[#FBCFE8]/40',
    'TOD': 'bg-[#FFEDD5] text-[#C2410C] border-[#FDBA74]/40',
    'OUTRO': 'bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]/40',
  };

  transform(value: string): string {
    return this.mapaCores[value?.toUpperCase()] ?? 'bg-[#E8E3EF] text-[#4A248A] border-[#B79CED]/30';
  }
}
