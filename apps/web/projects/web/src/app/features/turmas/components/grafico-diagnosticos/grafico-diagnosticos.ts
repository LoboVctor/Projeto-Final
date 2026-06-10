import { Component, Input, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { TurmasService } from '../../../../shared/services/turmas';

Chart.register(...registerables);

@Component({
  selector: 'app-grafico-diagnosticos',
  standalone: true,
  templateUrl: './grafico-diagnosticos.html',
  styleUrls: ['./grafico-diagnosticos.css']
})
export class GraficoDiagnosticosComponent implements OnInit {
  @Input() turmaId!: string;
  @ViewChild('meuGrafico', { static: true }) elementoCanvas!: ElementRef;

  private turmasService = inject(TurmasService);
  private chartInstancia: any;

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados() {
    this.turmasService.obterGraficosTurma(this.turmaId).subscribe({
      next: (dados) => this.renderizarGrafico(dados.diagnosticos),
      error: (err) => console.error('Erro ao carregar gráficos', err)
    });
  }

  renderizarGrafico(diagnosticos: any[]) {
    if (this.chartInstancia) this.chartInstancia.destroy();

    const labels = diagnosticos.map(d => d.tipo);
    const data = diagnosticos.map(d => d.quantidade);

    this.chartInstancia = new Chart(this.elementoCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            '#6C3CC9', // roxo-principal
            '#F4C542', // girassol
            '#B79CED', // lavanda
            '#5FA777', // verde-progresso
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Nunito' } } }
        }
      }
    });
  }
}