import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, effect, inject, signal, computed } from '@angular/core';
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

  semanaAtualVisualizada = signal<Date>(this.getMonday(new Date()));

  labelNavegadorSemana = computed(() => {
    const inicio = this.semanaAtualVisualizada();
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 4);

    const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')} ${d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}`;
    return `${fmt(inicio)} - ${fmt(fim)}`;
  });

  podeAvancarSemana = computed(() => {
    const segundaAtual = this.getMonday(new Date());
    return this.semanaAtualVisualizada() < segundaAtual;
  });

  // --- Instâncias dos Gráficos ---
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
    this.semanaAtualVisualizada.set(this.getMonday(new Date())); // Reseta para a semana atual ao abrir
    this.carregarHistorico(categoria);
  }

  fecharDetalheCategoria() {
    this.categoriaSelecionada.set(null);
    if (this.historicoChart) {
      this.historicoChart.destroy();
      this.historicoChart = undefined;
    }
  }

  private getMonday(d: Date) {
    const data = new Date(d);
    const dia = data.getDay();
    const diff = data.getDate() - dia + (dia === 0 ? -6 : 1); 
    data.setDate(diff);
    data.setHours(0, 0, 0, 0);
    return data;
  }

  navegarSemana(direcao: number) {
    const novaData = new Date(this.semanaAtualVisualizada());
    novaData.setDate(novaData.getDate() + (direcao * 7));
    this.semanaAtualVisualizada.set(novaData);
    
    if (this.categoriaSelecionada()) {
      this.carregarHistorico(this.categoriaSelecionada()!);
    }
  }

  private carregarHistorico(categoria: string) {
    const inicio = this.semanaAtualVisualizada();
    
    const formatarParaDataPura = (d: Date) => {
      const ano = d.getFullYear();
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      const dia = d.getDate().toString().padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    };

    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 4); 

    const strInicio = formatarParaDataPura(inicio);
    const strFim = formatarParaDataPura(fim);

    const mapaCategorias: Record<string, string> = {
      'Alimentação': 'Alimentação',
      'Banheiro': 'Banheiro',
      'Autonomia': 'Autonomia',
      'Comportamento': 'Comportamento',
      'Interação Social': 'Interação', 
      'Foco nas Atividades': 'Foco'   
    };

    const categoriaFormatada = mapaCategorias[categoria] || categoria;

    this.analyticsService.getAnalyticsHistorico(
      this.estudanteId, 
      this.periodo(), 
      categoriaFormatada, 
      strInicio, 
      strFim
    ).subscribe({
      next: (data) => {
        if (data && data.datasets && data.datasets.length > 0) {
          setTimeout(() => this.renderHistoricoChart(data, categoria), 0);
        } else {
          this.tratarGraficoHistoricoVazio(categoria);
        }
      },
      error: (err) => {
        console.error('Erro ao buscar histórico da categoria:', err);
      }
    });
  }

  private tratarGraficoHistoricoVazio(categoria: string) {
    if (this.historicoChart) this.historicoChart.destroy();
    const canvas = document.getElementById('historicoCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const contexto = canvas.getContext('2d');
    if (contexto) contexto.clearRect(0, 0, canvas.width, canvas.height);
    
    const dadosVazios = {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
      datasets: [{ label: categoria, data: [0, 0, 0, 0, 0] }]
    };
    this.renderHistoricoChart(dadosVazios, categoria);
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
            order: 1
          },
          {
            label: 'Track',
            data: trackBackground,
            backgroundColor: '#fef3c7',
            borderRadius: 20,
            borderSkipped: false,
            barThickness: 16,
            grouped: false,
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: { beginAtZero: true, max: 5, grid: { color: '#f3f4f6' } },
          x: { grid: { display: false } }
        },
        plugins: { 
          legend: { display: false },
          tooltip: {
            filter: function(tooltipItem) {
              return tooltipItem.dataset.label !== 'Track';
            }
          }
        }
      }
    });
  }

  // --- Lógica dos Gráficos Principais ---

  private renderGaugeChart(canvasId: string, chartInstance: Chart | undefined, valor: number, maximo: number, cores: string[]): Chart | undefined {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return chartInstance;
    if (chartInstance) chartInstance.destroy();
    
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
    
    const obterAnterior = (cat: any) => {
      if (!cat) return 0;
      if (cat.valorAnterior !== undefined) return cat.valorAnterior;
      return Math.max(0, Math.min(5, (cat.valor || 0) - (cat.variacao || 0)));
    };

    this.radarChart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['Alimentação', 'Banheiro', 'Autonomia', 'Comportamento', 'Interação', 'Foco'],
        datasets: [
          {
            label: 'Período Atual',
            data: [
              categorias.Alimentacao?.valor || 0, 
              categorias.Banheiro?.valor || 0, 
              categorias.Autonomia?.valor || 0, 
              categorias.Comportamento?.valor || 0, 
              categorias.Interacao?.valor || 0, 
              categorias.Foco?.valor || 0
            ],
            backgroundColor: 'rgba(74, 222, 128, 0.15)', 
            borderColor: '#22c55e',
            pointBackgroundColor: '#22c55e',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#22c55e',
            borderWidth: 2,
            order: 1
          },
          {
            label: 'Período Anterior',
            data: [
              obterAnterior(categorias.Alimentacao), 
              obterAnterior(categorias.Banheiro), 
              obterAnterior(categorias.Autonomia), 
              obterAnterior(categorias.Comportamento), 
              obterAnterior(categorias.Interacao), 
              obterAnterior(categorias.Foco)
            ],
            backgroundColor: 'rgba(168, 85, 247, 0.12)', 
            borderColor: '#a855f7',                     
            pointBackgroundColor: '#a855f7',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#a855f7',
            borderWidth: 2,
            borderDash: [4, 4], 
            order: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { 
          r: { 
            min: 0, 
            max: 5, 
            ticks: { display: false },
            grid: { color: '#f3f4f6' },
            angleLines: { color: '#f3f4f6' },
            pointLabels: {
              font: { size: 11, weight: 600, family: 'Sora' },
              color: '#475569'
            }
          } 
        },
        plugins: { 
          legend: { 
            display: true, 
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
              font: { size: 11, weight: 500, family: 'Sora' },
              color: '#475569'
            }
          } 
        }
      }
    });
  }
}