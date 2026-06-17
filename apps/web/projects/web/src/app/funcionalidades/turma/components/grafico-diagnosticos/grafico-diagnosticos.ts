import {
  Component,
  OnChanges,
  SimpleChanges,
  ElementRef,
  ViewChild,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
  input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Chart, registerables } from 'chart.js';
import { TurmasService } from '../../../../nucleo/services/turmas.service';

Chart.register(...registerables);

@Component({
  selector: 'app-grafico-diagnosticos',
  templateUrl: './grafico-diagnosticos.html',
  styleUrls: ['./grafico-diagnosticos.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class GraficoDiagnosticosComponent implements OnChanges {
  readonly turmaId = input.required<string>();
  @ViewChild('meuGrafico', { static: true }) elementoCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly turmasService = inject(TurmasService);

  private readonly destroyRef = inject(DestroyRef);
  private chartInstancia: Chart | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['turmaId'] && this.turmaId()) {
      this.carregarDados();
    }
  }

  carregarDados(): void {
    this.turmasService
      .obterGraficosTurma(this.turmaId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dados) => this.renderizarGrafico(dados.diagnosticos),
        error: () => {} });
  }

  renderizarGrafico(diagnosticos: { tipo: string; quantidade: number }[]): void {
    if (this.chartInstancia) {
      this.chartInstancia.destroy();
    }

    const labels = diagnosticos.map((d) => d.tipo);
    const data = diagnosticos.map((d) => d.quantidade);

    this.chartInstancia = new Chart(this.elementoCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              '#6C3CC9',
              '#F4C542',
              '#B79CED',
              '#5FA777',
            ],
            borderWidth: 0,
            hoverOffset: 4 },
        ] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Nunito' } } } } } });
  }
}
