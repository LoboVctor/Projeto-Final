import { Component, ViewChild, inject, computed, PLATFORM_ID, OnInit, signal, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { 
  NgApexchartsModule, ChartComponent, ApexNonAxisChartSeries, 
  ApexPlotOptions, ApexChart, ApexFill 
} from 'ng-apexcharts';
import { RegistrosDiariosService } from '../../shared/services/registros-diarios.service';
import { AuthService } from '../../core/services/auth';
import { RegistroDiarioPendente } from '../../shared/models/registros-diarios.models';

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
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  // Signals para as três métricas do Dashboard
  registrosPendentes = signal<RegistroDiarioPendente[]>([]);
  totalEsperado = signal<number>(0); 
  totalPreenchidos = signal<number>(0); 

  totalPendentes = computed(() => this.registrosPendentes().length);

  constructor() {
    this.chartOptions = {
      series: [0], 
      chart: { type: 'radialBar', height: 220, sparkline: { enabled: true } },
      plotOptions: {
        radialBar: {
          startAngle: -90, endAngle: 90,
          track: { background: '#E8E3EF', strokeWidth: '85%' },
          dataLabels: {
            name: { show: false },
            value: { offsetY: 0, fontSize: '28px', fontWeight: '700', color: '#2D1E40' }
          }
        }
      },
      fill: { colors: ['#4CAF50'], type: 'solid', opacity: 1 }
    };

    // O effect agora calcula o progresso real com base nos dados consolidados do mês
    effect(() => {
      const preenchidos = this.totalPreenchidos();
      const esperado = this.totalEsperado(); 

      // Se o banco possui registros gerados para o mês, calcula a porcentagem real concluída
      const taxaPreenchimento = esperado > 0 
        ? Math.min(100, Math.round((preenchidos / esperado) * 100)) 
        : 100; // Caso não existam registros gerados ainda, exibe 100% livre

      this.chartOptions = {
        ...this.chartOptions,
        series: [taxaPreenchimento],
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
      const educadorIdAtual = this.authService.getLoggedUserId();

      if (!educadorIdAtual) {
        console.warn('Dashboard Home: ID do educador não identificado.');
        return;
      }

      // 1. Busca a lista de cartões esquecidos em branco (alertas pendentes)
      this.registrosService.getAlertasPendentes(educadorIdAtual).subscribe({
        next: (dados) => this.registrosPendentes.set(dados),
        error: (err) => console.error('Erro ao buscar alertas pendentes:', err)
      });

      // 2. Busca o resumo mensal real com a contagem física efetuada pelo Prisma
      this.registrosService.getResumoMensal(educadorIdAtual).subscribe({
        next: (resumo) => {
          this.totalEsperado.set(resumo?.totalEsperado || 0);
          this.totalPreenchidos.set(resumo?.totalPreenchidos || 0);
        },
        error: (err) => console.error('Erro ao buscar resumo mensal:', err)
      });
    }
  }
}