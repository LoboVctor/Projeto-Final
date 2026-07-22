import { TipoDiagnostico } from '@prisma-client';

/** Nome por extenso de cada tipo de diagnóstico, usado ao criar um novo `Diagnostico` base. */
export const DIAGNOSTICO_NOME_LABEL: Record<TipoDiagnostico, string> = {
  TEA: 'Transtorno do Espectro Autista',
  TDAH: 'Transtorno do Déficit de Atenção com Hiperatividade',
  SINDROME_DOWN: 'Síndrome de Down',
  PARALISIA_CEREBRAL: 'Paralisia Cerebral',
  DEFICIENCIA_INTELECTUAL: 'Deficiência Intelectual',
  DEFICIENCIA_MULTIPLA: 'Deficiência Múltipla',
  OUTRO: 'Outro',
};
