import { Component, ViewChild, inject, computed, PLATFORM_ID, OnInit, signal, effect, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

  private readonly registrosService = inject(RegistrosDiariosService);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  // CR-05: DestroyRef para cancelar os subscribes ao destruir o componente
  private readonly destroyRef = inject(DestroyRef);

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

    // Calcula o progresso real com base nos dados consolidados do mês
    effect(() => {
      const preenchidos = this.totalPreenchidos();
      const esperado = this.totalEsperado();

      // Se não existem registros gerados para o mês, exibe 100% livre
      const taxaPreenchimento = esperado > 0
        ? Math.min(100, Math.round((preenchidos / esperado) * 100))
        : 100;

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
    if (!isPlatformBrowser(this.platformId)) return;

    const educadorIdAtual = this.authService.getLoggedUserId();
    if (!educadorIdAtual) {
      console.warn('Dashboard Home: ID do educador não identificado.');
      return;
    }

    // 1. Busca cartões pendentes (alertas de dias não preenchidos)
    this.registrosService
      .getAlertasPendentes(educadorIdAtual)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dados) => this.registrosPendentes.set(dados),
        error: (err) => console.error('Erro ao buscar alertas pendentes:', err),
      });

    // 2. Busca o resumo mensal com contagem física do Prisma
    this.registrosService
      .getResumoMensal(educadorIdAtual)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resumo) => {
          this.totalEsperado.set(resumo?.totalEsperado ?? 0);
          this.totalPreenchidos.set(resumo?.totalPreenchidos ?? 0);
        },
        error: (err) => console.error('Erro ao buscar resumo mensal:', err),
      });
  }
}