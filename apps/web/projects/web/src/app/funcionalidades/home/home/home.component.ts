import {
  Component,
  ViewChild,
  inject,
  computed,
  PLATFORM_ID,
  OnInit,
  signal,
  effect,
  DestroyRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common'; 
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule, Router } from '@angular/router';
import {
  NgApexchartsModule,
  ChartComponent,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill
} from 'ng-apexcharts';
import { RegistrosDiariosService } from '../../../compartilhado/services/registros-diarios.service';
import { AuthService } from '../../../nucleo/services/auth';
import { RegistroDiarioPendente } from '../../../compartilhado/models/registros-diarios.models';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
};

@Component({
  selector: 'app-home',
  imports: [NgApexchartsModule, RouterModule, DatePipe], 
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions;

  private readonly registrosService = inject(RegistrosDiariosService);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  registrosPendentes = signal<RegistroDiarioPendente[]>([]);
  totalEsperado = signal<number>(0);
  totalPreenchidos = signal<number>(0);
  loadingMetricas = signal<boolean>(true);

  totalPendentes = computed(() => this.registrosPendentes().length);

  // --- CONTROLE DO MODAL ---
  isModalPendenciasAberto = signal(false);

  constructor() {
    this.chartOptions = {
      series: [0],
      chart: { type: 'radialBar', height: 220, sparkline: { enabled: true } },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          track: { background: '#E8E3EF', strokeWidth: '85%' },
          dataLabels: {
            name: { show: false },
            value: { offsetY: 0, fontSize: '28px', fontWeight: '700', color: '#2D1E40' }
          }
        }
      },
      fill: { colors: ['#4CAF50'], type: 'solid', opacity: 1 }
    };

    effect(() => {
      const preenchidos = this.totalPreenchidos();
      const esperado = this.totalEsperado();

      const taxaPreenchimento =
        esperado > 0 ? Math.min(100, Math.round((preenchidos / esperado) * 100)) : 0;

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
      return;
    }

    this.registrosService
      .getAlertasPendentes(educadorIdAtual)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dados) => this.registrosPendentes.set(dados),
        error: () => {}
      });

    this.registrosService
      .getResumoMensal(educadorIdAtual)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resumo) => {
          this.totalEsperado.set(resumo?.totalEsperado ?? 0);
          this.totalPreenchidos.set(resumo?.totalPreenchidos ?? 0);
          this.loadingMetricas.set(false);
        },
        error: () => {
          this.loadingMetricas.set(false);
        }
      });
  }

  // --- FUNÇÕES DO MODAL ---
  abrirModal() {
    this.isModalPendenciasAberto.set(true);
  }

  fecharModal() {
    this.isModalPendenciasAberto.set(false);
  }

}