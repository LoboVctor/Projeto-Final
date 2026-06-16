import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstudantesService } from '../../../../shared/services/estudantes.service';
import {
  EstudantePedagogico,
  StatusRelatorio,
  Semestre,
  Eixo,
} from '../../../../shared/models/estudante-pedagogico.model';

// ── Label helpers ─────────────────────────────────────────────────────────────

const SEMESTRE_LABEL: Record<Semestre, string> = {
  PRIMEIRO: '1º Semestre',
  SEGUNDO: '2º Semestre',
};

const EIXO_LABEL: Record<Eixo, string> = {
  COGNITIVO: 'Cognitivo',
  MOTOR: 'Motor',
  LINGUAGEM: 'Linguagem',
  SOCIOEMOCIONAL: 'Socioemocional',
  AUTONOMIA: 'Autonomia',
};

const STATUS_LABEL: Record<StatusRelatorio, string> = {
  RASCUNHO: 'Rascunho',
  EM_REVISAO: 'Em andamento',
  CONCLUIDO: 'Concluído',
};

@Component({
  selector: 'app-bloco-relatorios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bloco-relatorios.html',
  styleUrls: ['./bloco-relatorios.css'],
})
export class BlocoRelatoriosComponent implements OnChanges {
  @Input() estudanteId!: string;

  private readonly estudantesService = inject(EstudantesService);

  // ── Estado ─────────────────────────────────────────────────────────────────
  dados: EstudantePedagogico | null = null;
  isLoading = false;
  erroCarregamento = false;

  /** Controla abertura do dropdown principal do bloco */
  isDropdownOpen = false;

  /** Índice do relatório semestral expandido no accordion interno (-1 = nenhum) */
  relatorioAberto: number = 0;

  /** Conjunto dos IDs de metas com corpo expandido */
  metasAbertas = new Set<string>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estudanteId']?.currentValue) {
      // Reseta o estado quando o estudante muda (ex: modal abre para outro aluno)
      this.dados = null;
      this.erroCarregamento = false;
      this.isDropdownOpen = false;
      this.relatorioAberto = 0;
      this.metasAbertas.clear();
    }
  }

  carregarDados(): void {
    this.isLoading = true;
    this.erroCarregamento = false;
    this.estudantesService.getPedagogico(this.estudanteId).subscribe({
      next: (res) => {
        this.dados = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro ao buscar dados pedagógicos', err);
        this.erroCarregamento = true;
        this.isLoading = false;
      },
    });
  }

  // ── Accordion ──────────────────────────────────────────────────────────────

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    // Carrega os dados na primeira abertura
    if (this.isDropdownOpen && !this.dados && !this.isLoading) {
      this.carregarDados();
    }
  }

  toggleRelatorio(index: number): void {
    this.relatorioAberto = this.relatorioAberto === index ? -1 : index;
  }

  toggleMeta(metaId: string): void {
    this.metasAbertas.has(metaId)
      ? this.metasAbertas.delete(metaId)
      : this.metasAbertas.add(metaId);
  }

  isMetaAberta(metaId: string): boolean {
    return this.metasAbertas.has(metaId);
  }

  // ── Label helpers expostos ao template ────────────────────────────────────

  semestreLabel(s: Semestre): string {
    return SEMESTRE_LABEL[s] ?? s;
  }

  eixoLabel(e: Eixo): string {
    return EIXO_LABEL[e] ?? e;
  }

  statusLabel(s: StatusRelatorio): string {
    return STATUS_LABEL[s] ?? s;
  }

  /** Classes Tailwind para badge de status */
  statusBadgeClass(s: StatusRelatorio): string {
    const map: Record<StatusRelatorio, string> = {
      RASCUNHO:   'bg-gray-100 text-gray-600 border border-gray-200',
      EM_REVISAO: 'bg-amber-50 text-amber-700 border border-amber-200',
      CONCLUIDO:  'bg-green-50 text-green-700 border border-green-200',
    };
    return map[s] ?? '';
  }

  /** Classes Tailwind para barra de progresso PIBI */
  progressoBarraClass(s: StatusRelatorio): string {
    const map: Record<StatusRelatorio, string> = {
      RASCUNHO:   'bg-gray-400',
      EM_REVISAO: 'bg-amber-400',
      CONCLUIDO:  'bg-green-500',
    };
    return map[s] ?? 'bg-purple-500';
  }

  /** Score em percentual (base 5) */
  progressoPibi(score: number): number {
    return Math.min(100, Math.round((score / 5) * 100));
  }

  /** Classes Tailwind para badge de score final da meta */
  scoreBadgeClass(score: number): string {
    if (score >= 4) return 'bg-green-50 text-green-700 border border-green-200';
    if (score >= 2) return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-red-50 text-red-700 border border-red-200';
  }

  /** Chip de eixo de desenvolvimento — cor por eixo */
  eixoChipClass(e: Eixo): string {
    const map: Record<Eixo, string> = {
      COGNITIVO:      'bg-blue-50 text-blue-700',
      MOTOR:          'bg-orange-50 text-orange-700',
      LINGUAGEM:      'bg-purple-50 text-purple-700',
      SOCIOEMOCIONAL: 'bg-pink-50 text-pink-700',
      AUTONOMIA:      'bg-teal-50 text-teal-700',
    };
    return map[e] ?? 'bg-gray-50 text-gray-700';
  }
}
