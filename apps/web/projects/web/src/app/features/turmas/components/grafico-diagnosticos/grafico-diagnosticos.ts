import { Component, Input, OnChanges, SimpleChanges, ElementRef, ViewChild, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Chart, registerables } from 'chart.js';
import { TurmasService } from '../../../../core/services/turmas.service';

Chart.register(...registerables);

@Component({
  selector: 'app-grafico-diagnosticos',
  standalone: true,
  templateUrl: './grafico-diagnosticos.html',
  styleUrls: ['./grafico-diagnosticos.css']
})
export class GraficoDiagnosticosComponent implements OnChanges {
  @Input() turmaId!: string;
  @ViewChild('meuGrafico', { static: true }) elementoCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly turmasService = inject(TurmasService);
  // CR-04: DestroyRef para cancelar o subscribe ao destruir o componente
  private readonly destroyRef = inject(DestroyRef);
  private chartInstancia: Chart | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['turmaId'] && this.turmaId) {
      this.carregarDados();
    }
  }

  carregarDados(): void {
    this.turmasService
      .obterGraficosTurma(this.turmaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dados) => this.renderizarGrafico(dados.diagnosticos),
        error: (err) => console.error('Erro ao carregar gráficos', err),
      });
  }

  renderizarGrafico(diagnosticos: { tipo: string; quantidade: number }[]): void {
    if (this.chartInstancia) {
      this.chartInstancia.destroy();
    }

    const labels = diagnosticos.map(d => d.tipo);
    const data = diagnosticos.map(d => d.quantidade);

    this.chartInstancia = new Chart(this.elementoCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [
            '#6C3CC9', // roxo-principal
            '#F4C542', // girassol
            '#B79CED', // lavanda
            '#5FA777', // verde-progresso
          ],
          borderWidth: 0,
          hoverOffset: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Nunito' } } },
        },
      },
    });
  }
}