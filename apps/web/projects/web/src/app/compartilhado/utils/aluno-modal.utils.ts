import { AlunoModalData } from '../models/aluno-modal.model';

/** Mapa de labels abreviados por tipo de diagnóstico */
const DIAG_LABEL: Record<string, string> = {
  TEA: 'TEA',
  TDAH: 'TDAH',
  SINDROME_DOWN: 'S.DOWN',
  PARALISIA_CEREBRAL: 'PC',
  DEFICIENCIA_INTELECTUAL: 'DI',
  DEFICIENCIA_MULTIPLA: 'DEMU',
  OUTRO: 'OUTRO',
};

/**
 * Gera a URL do avatar do aluno.
 * - Se tiver foto cadastrada e for URL absoluta, usa direto.
 * - Se for caminho relativo, prefixa com a baseUrl da API.
 * - Se não tiver foto, gera avatar dinâmico (DiceBear) baseado no nome.
 */
export function buildFotoUrl(nome: string, foto: string | null | undefined, baseUrl: string): string {
  if (!foto) {
    const seed = encodeURIComponent(nome.replace(/\s+/g, ''));
    return `https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=${seed}`;
  }
  if (foto.startsWith('http')) {
    return foto;
  }
  const normalizedPath = foto.replace(/\\/g, '/');
  return `${baseUrl}/${normalizedPath}`;
}

/**
 * Gera a string de diagnósticos para exibição no modal.
 * - Limita a no máximo 2 diagnósticos (os primeiros da lista).
 * - Usa labels abreviados do mapa DIAG_LABEL.
 * - Retorna '-' se não houver diagnóstico.
 */
export function buildDiagnosticoLabel(
  diagnosticos: Array<{ diagnostico: { tipo: string } }>
): string {
  if (!diagnosticos || diagnosticos.length === 0) return '-';
  return getDiagnosticosArrayForCard(diagnosticos)
    .map((tipo) => DIAG_LABEL[tipo] || tipo)
    .join(', ');
}

/**
 * Retorna um array de até 2 tipos de diagnóstico crus.
 * Útil para passar para o input [diagnosticos] do app-card-aluno.
 */
export function getDiagnosticosArrayForCard(
  diagnosticos: Array<{ diagnostico: { tipo: string } }>
): string[] {
  if (!diagnosticos || diagnosticos.length === 0) return [];
  return diagnosticos.slice(0, 2).map((d) => d.diagnostico.tipo);
}

/**
 * Gera a string de turmas do aluno para exibição no modal.
 * - Exibe todas as turmas separadas por " / ".
 * - Retorna '-' se não houver turma.
 */
export function buildTurmaLabel(turmas: Array<{ nome: string }>): string {
  if (!turmas || turmas.length === 0) return '-';
  return turmas.map((t) => t.nome).join(' / ');
}

/**
 * Monta o objeto AlunoModalData padronizado para qualquer tela.
 * As turmas são recebidas como array para manter consistência
 * mesmo quando o contexto é uma única turma selecionada.
 */
export function buildAlunoModalData(
  aluno: {
    id: string;
    nomeCompleto: string;
    foto?: string | null;
    diagnosticos: Array<{ diagnostico: { tipo: string } }>;
    turmas: Array<{ nome: string }>;
  },
  baseUrl: string
): AlunoModalData {
  return {
    id: aluno.id,
    nome: aluno.nomeCompleto,
    turma: buildTurmaLabel(aluno.turmas),
    diagnostico: buildDiagnosticoLabel(aluno.diagnosticos),
    nivelSuporte: 'Nível 1 de Suporte',
    foto: buildFotoUrl(aluno.nomeCompleto, aluno.foto, baseUrl),
  };
}