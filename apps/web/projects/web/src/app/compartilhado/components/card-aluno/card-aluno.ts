import { Component, input, output, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { calcularIdade } from '../../utils/date.utils';
import { DiagLabelPipe } from '../../pipes/student.pipes';
import { DiagnosticoVisibilidadeService } from '../../services/diagnostico-visibilidade.service';

/** Contrato mínimo de dados do estudante necessário para renderizar o card. */
export interface EstudanteCardInput {
  nomeCompleto: string;
  dataNascimento: string;
  turmas?: Array<{ nome: string }>;
}

/** Mapa de cores por tipo de diagnóstico (usado para gerar badges) */
const MAPA_CORES_DIAG: Record<string, string> = {
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

function corParaDiag(tipo: string): string {
  return MAPA_CORES_DIAG[tipo.toUpperCase()] ?? 'bg-[#E8E3EF] text-[#4A248A] border-[#B79CED]/30';
}

@Component({
  selector: 'app-card-aluno',
  imports: [DiagLabelPipe],
  templateUrl: './card-aluno.html',
  styleUrl: './card-aluno.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardAlunoComponent {
  protected readonly diagVis = inject(DiagnosticoVisibilidadeService);

  nome = input.required<string>();
  foto = input<string | null>();
  diagnostico = input.required<string>();
  diagnosticos = input<string[]>();
  matricula = input.required<number>();
  estudante = input.required<EstudanteCardInput>();
  nivelSuporte = input<string | null>();

  idade = computed(() => calcularIdade(this.estudante().dataNascimento));

  tagsDeDiagnostico = computed<Array<{ tipo: string; classe: string }>>(() => {
    const multi = this.diagnosticos();
    if (multi && multi.length > 0) {
      return multi.map(tipo => ({ tipo, classe: corParaDiag(tipo) }));
    }
    const single = this.diagnostico();
    return [{ tipo: single, classe: corParaDiag(single) }];
  });

  classeCorTag = computed(() => corParaDiag(this.diagnostico()));

  abrirPerfil = output<void>();
}
