import { Component, ViewChild, inject, computed, PLATFORM_ID, OnInit, signal, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { 
  NgApexchartsModule, ChartComponent, ApexNonAxisChartSeries, 
  ApexPlotOptions, ApexChart, ApexFill 
} from 'ng-apexcharts';
import { RegistrosDiariosService } from '../../shared/services/registros-diarios.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions;

  private registrosService = inject(RegistrosDiariosService);
  private platformId = inject(PLATFORM_ID);
  private educadorIdAtual = 'educador-regente-seed-0000-0000';

  registrosPendentes = signal<any[]>([]);
  totalPendentes = computed(() => this.registrosPendentes().length);

  constructor() {
    // 1. Configuração visual base (Inicia a 0% enquanto carrega)
    this.chartOptions = {
      series: [0], 
      chart: { type: 'radialBar', height: 180, sparkline: { enabled: true } },
      plotOptions: {
        radialBar: {
          startAngle: -90, endAngle: 90,
          track: { background: '#E8E3EF', strokeWidth: '75%' },
          dataLabels: {
            name: { show: false },
            value: { offsetY: 0, fontSize: '28px', fontWeight: '700', color: '#2D1E40' }
          }
        }
      },
      fill: { colors: ['#4CAF50'], type: 'solid', opacity: 1 }
    };

    // 2. A Magia do Angular: O effect() liga os Signals ao ApexCharts
    effect(() => {
      const pendentes = this.totalPendentes();

      // Transformação do valor absoluto numa métrica percentual
      // Assumindo um cenário hipotético de 30 alunos/atividades no total
      const totalEsperado = 30; 
      let taxaPreenchimento = 100;

      if (pendentes > 0) {
        // Calcula a percentagem e garante que nunca desce abaixo de 0
        taxaPreenchimento = Math.max(0, Math.round(((totalEsperado - pendentes) / totalEsperado) * 100));
      }

      // Atualiza a referência do objeto chartOptions para forçar a re-renderização do gráfico
      this.chartOptions = {
        ...this.chartOptions,
        series: [taxaPreenchimento],
        // Bónus analítico: Muda a cor para vermelho/laranja se a taxa cair muito!
        fill: { 
          colors: [taxaPreenchimento < 80 ? '#F44336' : '#4CAF50'], 
          type: 'solid', 
          opacity: 1 
        }
      };
    });
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.registrosService.getAlertasPendentes(this.educadorIdAtual).subscribe({
        next: (dados) => {
          // Quando esta linha rodar, o effect() lá em cima dispara instantaneamente!
          this.registrosPendentes.set(dados); 
        },
        error: (err) => console.error('Erro ao buscar dados do gráfico:', err)
      });
    }
  }
}