import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AnalyticsService } from '../../../../compartilhado/services/analytics.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-bloco-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bloco-dashboard.html',
  styleUrls: ['./bloco-dashboard.css']
})
export class BlocoDashboardComponent {
  @Input({ required: true }) estudanteId!: string;
  @Output() recolher = new EventEmitter<void>();

  private analyticsService = inject(AnalyticsService);

  periodo = signal<'semana' | 'mes' | 'semestre'>('mes');
  categoriaSelecionada = signal<string | null>(null);

  private radarChart?: Chart;
  private mediaGaugeChart?: Chart;
  private frequenciaGaugeChart?: Chart;
  private historicoChart?: Chart;

  private dashboardResumo$ = toObservable(this.periodo).pipe(
    switchMap(p => this.analyticsService.getDashboardSummary(this.estudanteId, p)),
    catchError(() => of(null))
  );
  dashboardData = toSignal(this.dashboardResumo$);

  constructor() {
    effect(() => {
      const data = this.dashboardData();
      
      if (data) {
        setTimeout(() => {
          this.mediaGaugeChart = this.renderGaugeChart(
            'mediaGaugeCanvas', 
            this.mediaGaugeChart, 
            data.mediaGeral.valor, 
            5, 
            ['#f59e0b', '#fef3c7']
          );
          
          this.frequenciaGaugeChart = this.renderGaugeChart(
            'frequenciaGaugeCanvas', 
            this.frequenciaGaugeChart, 
            data.frequencia.valor, 
            100, 
            ['#22c55e', '#dcfce7']
          );

          this.renderRadarChart(data.categorias);
        }, 0);
      }
    });
  }

  // --- Controles de Navegação ---

  onRecolher() {
    this.recolher.emit();
  }

  mudarPeriodo(novoPeriodo: 'semana' | 'mes' | 'semestre') {
    this.periodo.set(novoPeriodo);
    if (this.categoriaSelecionada()) {
      this.carregarHistorico(this.categoriaSelecionada()!);
    }
  }

  onPeriodoChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const novoPeriodo = selectElement.value as 'semana' | 'mes' | 'semestre';
    this.mudarPeriodo(novoPeriodo);
  }

  abrirDetalheCategoria(categoria: string) {
    this.categoriaSelecionada.set(categoria);
    this.carregarHistorico(categoria);
  }

  fecharDetalheCategoria() {
    this.categoriaSelecionada.set(null);
    if (this.historicoChart) {
      this.historicoChart.destroy();
      this.historicoChart = undefined;
    }
  }

  // --- Lógica do Modal Interno (Histórico) ---

  private carregarHistorico(categoria: string) {
    this.analyticsService.getAnalyticsHistorico(this.estudanteId, this.periodo(), categoria).subscribe(data => {
      setTimeout(() => this.renderHistoricoChart(data, categoria), 0);
    });
  }

  private renderHistoricoChart(data: any, categoria: string) {
    const canvas = document.getElementById('historicoCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.historicoChart) this.historicoChart.destroy();

    const trackBackground = Array(data.labels.length).fill(5);

    this.historicoChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: categoria,
            data: data.datasets[0].data,
            backgroundColor: '#f97316',
            borderRadius: 20,
            borderSkipped: false,
            barThickness: 16,
            grouped: false,
            order: 2
          },
          {
            label: 'Track',
            data: trackBackground,
            backgroundColor: '#fef3c7',
            borderRadius: 20,
            borderSkipped: false,
            barThickness: 16,
            grouped: false,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 5, grid: { color: '#f3f4f6' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  // --- Lógica dos Gráficos Principais ---

  private renderGaugeChart(canvasId: string, chartInstance: Chart | undefined, valor: number, maximo: number, cores: string[]): Chart | undefined {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return chartInstance;
    if (chartInstance) chartInstance.destroy();
    
    // Evita valores negativos ou acima do máximo
    const valorSeguro = Math.min(Math.max(valor, 0), maximo);
    const restante = maximo - valorSeguro;

    return new Chart(canvas, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [valorSeguro, restante], 
          backgroundColor: cores,
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }]
      },
      options: {
        cutout: '80%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { tooltip: { enabled: false }, legend: { display: false } }
      }
    });
  }

  private renderRadarChart(categorias: any) {
    const canvas = document.getElementById('radarCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.radarChart) this.radarChart.destroy();
    
    this.radarChart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['Alimentação', 'Banheiro', 'Autonomia', 'Comportamento', 'Interação', 'Foco'],
        datasets: [{
          label: 'Média',
          data: [
            categorias.Alimentacao?.valor || 0, 
            categorias.Banheiro?.valor || 0, 
            categorias.Autonomia?.valor || 0, 
            categorias.Comportamento?.valor || 0, 
            categorias.Interacao?.valor || 0, 
            categorias.Foco?.valor || 0
          ],
          backgroundColor: 'rgba(74, 222, 128, 0.2)',
          borderColor: '#22c55e',
          pointBackgroundColor: '#1e1b4b',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { min: 0, max: 5, ticks: { display: false } } },
        plugins: { legend: { display: false } }
      }
    });
  }
}