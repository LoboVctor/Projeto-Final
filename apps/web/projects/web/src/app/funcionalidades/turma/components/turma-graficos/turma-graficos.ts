import {
  Component,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ElementRef,
  ViewChild,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
  signal,
  input,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Chart, registerables } from 'chart.js';
import { TurmasService, MetricasTurma } from '../../../../nucleo/services/turmas.service';

Chart.register(...registerables);

/** Labels amigáveis para diagnósticos */
const DIAG_LABEL: Record<string, string> = {
  TEA: 'TEA',
  TDAH: 'TDAH',
  SINDROME_DOWN: 'Síndrome de Down',
  PARALISIA_CEREBRAL: 'Paralisia Cerebral',
  DEFICIENCIA_INTELECTUAL: 'Def. Intelectual',
  DEFICIENCIA_MULTIPLA: 'Def. Múltipla',
  OUTRO: 'Outro',
};

/** Cor da barra por tipo de diagnóstico (padronizado em roxo) */
const DIAG_BAR_COLOR: Record<string, string> = {
  TEA: '#4A248A',
  TDAH: '#4A248A',
  SINDROME_DOWN: '#4A248A',
  PARALISIA_CEREBRAL: '#4A248A',
  DEFICIENCIA_INTELECTUAL: '#4A248A',
  DEFICIENCIA_MULTIPLA: '#4A248A',
  OUTRO: '#4A248A',
};

/** Cor da borda da barra por tipo de diagnóstico */
const DIAG_BORDER_COLOR: Record<string, string> = {
  TEA: '#6C3CC9',
  TDAH: '#6C3CC9',
  SINDROME_DOWN: '#6C3CC9',
  PARALISIA_CEREBRAL: '#6C3CC9',
  DEFICIENCIA_INTELECTUAL: '#6C3CC9',
  DEFICIENCIA_MULTIPLA: '#6C3CC9',
  OUTRO: '#6C3CC9',
};

/** Labels amigáveis para sexo */
const SEXO_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  OUTRO: 'Outro',
};

/** Labels amigáveis para forma de comunicação */
const FCOM_LABEL: Record<string, string> = {
  VERBAL: 'Verbal',
  NAO_VERBAL: 'Não Verbal',
};

@Component({
  selector: 'app-turma-graficos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './turma-graficos.html',
  styleUrls: ['./turma-graficos.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurmaGraficosComponent implements OnDestroy {
  /** ID da turma para buscar métricas da API. Opcional se `dadosExternos` for fornecido. */
  readonly turmaId = input<string | null>(null);

  /** Dados pré-carregados (ex: métricas globais da escola). Se fornecido, não busca da API. */
  readonly dadosExternos = input<MetricasTurma | null>(null);

  @ViewChild('canvasSexo', { static: false }) canvasSexo?: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasIdade', { static: false }) canvasIdade?: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasDiag', { static: false }) canvasDiag?: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasCom', { static: false }) canvasCom?: ElementRef<HTMLCanvasElement>;

  private readonly turmasService = inject(TurmasService);
  private readonly destroyRef = inject(DestroyRef);

  metricas = signal<MetricasTurma | null>(null);
  loading = signal(false);
  erro = signal<string | null>(null);

  private graficosInstancias: Record<string, Chart> = {};

  constructor() {
    // Reage a dados externos (ex: Home do Coordenador com métricas globais)
    effect(() => {
      const externos = this.dadosExternos();
      if (externos) {
        untracked(() => {
          this.metricas.set(externos);
          this.loading.set(false);
          requestAnimationFrame(() => this.renderizarTodos(externos));
        });
        return;
      }
      // Caso contrário, busca da API usando turmaId
      const id = this.turmaId();
      if (id) {
        untracked(() => this.carregarMetricas());
      }
    });
  }

  carregarMetricas(): void {
    const id = this.turmaId();
    if (!id) return;
    if (!this.metricas()) {
      this.loading.set(true);
    }
    this.erro.set(null);

    this.turmasService
      .obterMetricasTurma(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dados) => {
          this.metricas.set(dados);
          this.loading.set(false);
          // Aguarda o próximo frame de pintura para garantir que os <canvas>
          // do @if (metricas()) já foram inseridos no DOM antes de renderizar.
          requestAnimationFrame(() => this.renderizarTodos(dados));
        },
        error: () => {
          this.erro.set('Não foi possível carregar os gráficos da turma.');
          this.loading.set(false);
        },
      });
  }

  private renderizarTodos(dados: MetricasTurma): void {
    this.renderizarSexo(dados);
    this.renderizarIdade(dados);
    this.renderizarDiag(dados);
    this.renderizarCom(dados);
  }

  private renderizarSexo(dados: MetricasTurma): void {
    if (!this.canvasSexo) return;
    
    const SEXO_COLOR: Record<string, string> = {
      MASCULINO: '#4A248A',
      FEMININO: '#f4c54e',
      OUTRO: '#B79CED',
    };

    const datasets = dados.distribuicaoSexo.map((d) => ({
      label: SEXO_LABEL[d.sexo] ?? d.sexo,
      data: [d.quantidade], 
      backgroundColor: SEXO_COLOR[d.sexo] ?? '#9CA3AF',
      borderWidth: 2,       
      borderColor: '#ffffff',
      borderRadius: 4,      
      borderSkipped: false,
      barPercentage: 0.6    
    }));

    const chart = this.graficosInstancias['sexo'];
    if (chart) {
      chart.data.datasets = datasets;
      chart.update();
    } else {
      this.graficosInstancias['sexo'] = new Chart(this.canvasSexo.nativeElement, {
        type: 'bar',
        data: {
          labels: [''], 
          datasets,
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 0 },
          scales: {
            x: { stacked: true, display: false },
            y: { stacked: true, display: false }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Nunito', size: 11 } }
            },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.dataset.label}: ${context.raw}`
              }
            }
          }
        },
        plugins: [{
          id: 'textInsideBarSexo',
          afterDatasetsDraw(chartInstance) {
            const { ctx, data } = chartInstance;
            let total = 0;
            
            data.datasets.forEach(ds => total += (ds.data[0] as number) || 0);

            data.datasets.forEach((dataset, i) => {
              const meta = chartInstance.getDatasetMeta(i);
              const bar = meta.data[0] as any; 
              const valor = (dataset.data[0] as number) || 0;

              if (bar && valor > 0 && total > 0) {
                const percentagem = ((valor / total) * 100).toFixed(1).replace('.0', '') + '%';
                
                const centroX = (bar.x + bar.base) / 2;
                const centroY = bar.y;

                ctx.save();
                ctx.fillStyle = '#ffffff'; 
                ctx.font = 'bold 12px "Nunito", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                if ((bar.x - bar.base) > 30) {
                  ctx.fillText(percentagem, centroX, centroY);
                }
                ctx.restore();
              }
            });
          }
        }]
      });
    }
  }

  private renderizarIdade(dados: MetricasTurma): void {
    if (!this.canvasIdade) return;
    const labels = dados.distribuicaoIdade.map((d) => `${d.idade} anos`);
    const data = dados.distribuicaoIdade.map((d) => d.quantidade);
    const chart = this.graficosInstancias['idade'];
    if (chart && chart.data.datasets[0]) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.update();
    } else {
      this.graficosInstancias['idade'] = new Chart(this.canvasIdade.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Alunos',
            data,
            backgroundColor: '#4A248A',
            borderWidth: 0,
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
          },
        },
      });
    }
  }

  private renderizarDiag(dados: MetricasTurma): void {
    if (!this.canvasDiag) return;
    const labels = dados.distribuicaoDiagnostico.map((d) => DIAG_LABEL[d.tipo] ?? d.tipo);
    const data = dados.distribuicaoDiagnostico.map((d) => d.quantidade);
    const bgColors = dados.distribuicaoDiagnostico.map((d) => DIAG_BAR_COLOR[d.tipo] ?? '#9CA3AF');
    const borderColors = dados.distribuicaoDiagnostico.map((d) => DIAG_BORDER_COLOR[d.tipo] ?? '#6B7280');
    const chart = this.graficosInstancias['diag'];
    if (chart && chart.data.datasets[0]) {
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      chart.data.datasets[0].backgroundColor = bgColors;
      chart.data.datasets[0].borderColor = borderColors;
      chart.update();
    } else {
      this.graficosInstancias['diag'] = new Chart(this.canvasDiag.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Alunos',
            data,
            backgroundColor: bgColors,
            borderWidth: 0,
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } },
          },
        },
      });
    }
  }

  private renderizarCom(dados: MetricasTurma): void {
    if (!this.canvasCom) return;

    const datasets = dados.distribuicaoComunicacao.map((d) => ({
      label: FCOM_LABEL[d.forma] ?? d.forma,
      data: [d.quantidade],
      backgroundColor: d.forma === 'VERBAL' ? '#f4c54e' : '#4A248A',
      borderWidth: 2,
      borderColor: '#ffffff',
      borderRadius: 4,
      borderSkipped: false,
      barPercentage: 0.6
    }));

    const chart = this.graficosInstancias['com'];
    if (chart) {
      chart.data.datasets = datasets;
      chart.update();
    } else {
      this.graficosInstancias['com'] = new Chart(this.canvasCom.nativeElement, {
        type: 'bar',
        data: {
          labels: [''],
          datasets,
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: 0 },
          scales: {
            x: { stacked: true, display: false },
            y: { stacked: true, display: false }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true, boxWidth: 8, font: { family: 'Nunito', size: 11 } }
            },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.dataset.label}: ${context.raw}`
              }
            }
          }
        },

        plugins: [{
          id: 'textInsideBarCom',
          afterDatasetsDraw(chartInstance) {
            const { ctx, data } = chartInstance;
            let total = 0;
            data.datasets.forEach(ds => total += (ds.data[0] as number) || 0);

            data.datasets.forEach((dataset, i) => {
              const meta = chartInstance.getDatasetMeta(i);
              const bar = meta.data[0] as any;
              const valor = (dataset.data[0] as number) || 0;

              if (bar && valor > 0 && total > 0) {
                const percentagem = ((valor / total) * 100).toFixed(1).replace('.0', '') + '%';
                const centroX = (bar.x + bar.base) / 2;
                const centroY = bar.y;

                ctx.save();
                ctx.fillStyle = '#ffffff'; 
                ctx.font = 'bold 12px "Nunito", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                if ((bar.x - bar.base) > 30) {
                  ctx.fillText(percentagem, centroX, centroY);
                }
                ctx.restore();
              }
            });
          }
        }]
      });
    }
  }

  ngOnDestroy(): void {
    this.destruirGraficos();
  }

  private destruirGraficos(): void {
    Object.values(this.graficosInstancias).forEach((g) => g.destroy());
    this.graficosInstancias = {};
  }
}
