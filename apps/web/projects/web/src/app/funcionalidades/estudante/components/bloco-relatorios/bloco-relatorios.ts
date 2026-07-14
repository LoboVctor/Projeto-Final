import {
  Component,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  input,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstudantesService } from '../../../../compartilhado/services/estudantes.service';
import {
  EstudantePedagogico,
  StatusRelatorio,
  Semestre,
  Eixo,
  MetaDesenvolvimento
} from '../../../../compartilhado/models/estudante-pedagogico.model';
import { EstudoDeCasoDrawerComponent } from '../estudo-de-caso-drawer/estudo-de-caso-drawer.component';
import { MetasModalComponent } from './modais/metas-modal.component';
import { AvaliacaoMetaModalComponent } from './modais/avaliacao-meta-modal.component';



const SEMESTRE_LABEL: Record<Semestre, string> = {
  PRIMEIRO: '1º Semestre',
  SEGUNDO: '2º Semestre'
};

const EIXO_LABEL: Record<Eixo, string> = {
  COGNITIVO: 'Cognitivo',
  MOTOR: 'Motor',
  LINGUAGEM: 'Linguagem',
  SOCIOEMOCIONAL: 'Socioemocional',
  AUTONOMIA: 'Autonomia'
};

const STATUS_LABEL: Record<StatusRelatorio, string> = {
  RASCUNHO: 'Rascunho',
  EM_REVISAO: 'Em andamento',
  CONCLUIDO: 'Concluído'
};

@Component({
  selector: 'app-bloco-relatorios',
  imports: [CommonModule, EstudoDeCasoDrawerComponent, MetasModalComponent, AvaliacaoMetaModalComponent],
  templateUrl: './bloco-relatorios.html',
  styleUrls: ['./bloco-relatorios.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlocoRelatoriosComponent implements OnInit, OnChanges {
  readonly estudanteId = input.required<string>();
  /** Nome do estudante para exibir no drawer de estudo de caso */
  readonly estudanteNome = input<string>('');
  @Output() recolher = new EventEmitter<void>();

  private readonly estudantesService = inject(EstudantesService);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Controla abertura do drawer de Estudo de Caso */
  drawerEstudoCasoAberto = signal(false);

  /** Controla abertura do modal de Metas do Semestre */
  metasModalAberto = signal(false);

  /** Meta selecionada para avaliação final */
  metaSelecionadaParaAvaliacao = signal<MetaDesenvolvimento | null>(null);


  dados: EstudantePedagogico | null = null;
  isLoading = false;
  erroCarregamento = false;

  /** Controla abertura do dropdown principal do bloco */
  isDropdownOpen = false;

  /** Índice do relatório semestral expandido no accordion interno (-1 = nenhum, estado inicial) */
  relatorioAberto: number = -1;

  /** Conjunto dos IDs de metas com corpo expandido */
  metasAbertas = new Set<string>();

  ngOnInit(): void {
    if (this.estudanteId()) {
      this.carregarDados();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estudanteId']?.currentValue && !changes['estudanteId'].isFirstChange()) {

      this.dados = null;
      this.erroCarregamento = false;
      this.relatorioAberto = -1; // Garante que todos os dropdowns iniciem fechados ao trocar de aluno
      this.metasAbertas.clear();
      this.carregarDados();
    }
  }

  carregarDados(): void {
    this.isLoading = true;
    this.erroCarregamento = false;
    this.cdr.detectChanges();
    this.estudantesService.getPedagogico(this.estudanteId()).subscribe({
      next: (res) => {
        this.dados = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.erroCarregamento = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }



  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;

    if (this.isDropdownOpen && !this.dados && !this.isLoading) {
      this.carregarDados();
    }
  }

  onRecolher(): void {
    this.recolher.emit();
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

  abrirAvaliacaoMeta(meta: MetaDesenvolvimento, event: Event): void {
    event.stopPropagation();
    this.metaSelecionadaParaAvaliacao.set(meta);
  }

  fecharAvaliacaoMeta(): void {
    this.metaSelecionadaParaAvaliacao.set(null);
  }


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
      RASCUNHO: 'bg-gray-100 text-gray-600 border border-gray-200',
      EM_REVISAO: 'bg-amber-50 text-amber-700 border border-amber-200',
      CONCLUIDO: 'bg-green-50 text-green-700 border border-green-200'
    };
    return map[s] ?? '';
  }

  /** Classes Tailwind para barra de progresso PIBI */
  progressoBarraClass(s: StatusRelatorio): string {
    const map: Record<StatusRelatorio, string> = {
      RASCUNHO: 'bg-gray-400',
      EM_REVISAO: 'bg-amber-400',
      CONCLUIDO: 'bg-green-500'
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
      COGNITIVO: 'bg-blue-50 text-blue-700',
      MOTOR: 'bg-orange-50 text-orange-700',
      LINGUAGEM: 'bg-purple-50 text-purple-700',
      SOCIOEMOCIONAL: 'bg-pink-50 text-pink-700',
      AUTONOMIA: 'bg-teal-50 text-teal-700'
    };
    return map[e] ?? 'bg-gray-50 text-gray-700';
  }

  /** Exibe semestre + ano no formato 2026.1 / 2026.2 */
  semestreAno(semestre: Semestre, ano: number): string {
    return `${ano}.${semestre === 'PRIMEIRO' ? '1' : '2'}`;
  }

  /** Label visual derivada do scoreFinal */
  scoreFinalLabel(score: number): string {
    if (score === 5) return 'Alcançado';
    if (score >= 3) return 'Parcialmente alcançado';
    if (score >= 1) return 'Não alcançado';
    return 'Pendente';
  }

  /** Badge derivado do scoreFinal */
  scoreFinalBadgeClass(score: number): string {
    if (score === 5) return 'bg-green-50 text-green-700 border border-green-200';
    if (score >= 3) return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (score >= 1) return 'bg-red-50 text-red-700 border border-red-200';
    return 'bg-gray-100 text-gray-500 border border-gray-200';
  }
}
