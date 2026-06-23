import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegistroDiario } from '../../../../../../compartilhado/models/registros-diarios.models';
import { ScoreKey } from '../../bloco-agenda.component';

interface IndicadorScore {
  key: ScoreKey;
  label: string;
}

@Component({
  selector: 'app-score-diario',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './score-diario.component.html',
  styleUrls: ['./score-diario.component.css']
})
export class ScoreDiarioComponent implements OnChanges {
  @Input() registro: RegistroDiario | null = null;
  @Output() salvarScores = new EventEmitter<Partial<RegistroDiario>>();

  readonly posicoes = [1, 2, 3, 4, 5];
  hoverMap: Record<string, number> = {};

  modoEdicao: boolean = false;
  scoresEditados: Partial<RegistroDiario> = {};

  readonly indicadores: IndicadorScore[] = [
    { key: 'statusAlimentacao', label: 'Alimentação' },
    { key: 'usoBanheiro', label: 'Banheiro' },
    { key: 'scoreAutonomia', label: 'Autonomia' },
    { key: 'scoreComportamento', label: 'Comportamento Diário' },
    { key: 'scoreInteracao', label: 'Interação Social' },
    { key: 'scoreFoco', label: 'Foco nas Atividades' }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['registro']) {
      this.cancelarEdicao();
    }
  }

  ativarEdicao(): void {
    this.scoresEditados = { ...this.registro };
    this.modoEdicao = true;
  }

  cancelarEdicao(): void {
    this.scoresEditados = {};
    this.modoEdicao = false;
    this.hoverMap = {};
  }

  salvar(): void {
    this.salvarScores.emit(this.scoresEditados);
    this.modoEdicao = false;
  }

  getScoreOriginal(key: ScoreKey): number {
    if (!this.registro) return 0;
    const val = (this.registro as any)[key];
    return this.normalizarScore(val);
  }

  getScoreExibicao(key: ScoreKey): number {
    if (this.modoEdicao) {
      const val = (this.scoresEditados as any)[key];
      const scoreEditado = this.normalizarScore(val);
      if (scoreEditado > 0) return scoreEditado;
    }
    return this.getScoreOriginal(key);
  }

  isAtivo(key: ScoreKey, posicao: number): boolean {
    const hover = this.hoverMap[key] ?? 0;
    const valorDaMetrica = hover > 0 ? hover : this.getScoreExibicao(key);
    return valorDaMetrica >= posicao;
  }

  aplicarHover(key: ScoreKey, posicao: number): void {
    if (!this.modoEdicao) return;
    this.hoverMap = { ...this.hoverMap, [key]: posicao };
  }

  limparHover(key: ScoreKey): void {
    const m = { ...this.hoverMap };
    delete m[key];
    this.hoverMap = m;
  }

  selecionarScore(key: ScoreKey, value: number): void {
    if (!this.modoEdicao) return;
    this.scoresEditados = { ...this.scoresEditados, [key]: value };
  }

  private normalizarScore(value: unknown): number {
    const numero = Number(value);
    if (!Number.isFinite(numero)) return 0;
    return Math.min(Math.max(Math.trunc(numero), 0), 5);
  }

  getClassificacao(score: number): string {
    switch (score) {
      case 1: return 'Urgente';
      case 2: return 'Atenção';
      case 3: return 'Regular';
      case 4: return 'Bom';
      case 5: return 'Ótimo';
      default: return '';
    }
  }

  getClassificacaoClasse(score: number): string {
    switch (score) {
      case 1: return 'bg-red-100 text-red-700';
      case 2: return 'bg-orange-100 text-orange-700';
      case 3: return 'bg-yellow-100 text-yellow-700';
      case 4: return 'bg-green-100 text-green-700';
      case 5: return 'bg-emerald-100 text-emerald-700';
      default: return '';
    }
  }
}
