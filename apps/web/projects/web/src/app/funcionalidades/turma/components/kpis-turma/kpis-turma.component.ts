import { Component, input, effect, ElementRef, ViewChild, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe, NgClass, DatePipe } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { TurmasService } from '../../../../nucleo/services/turmas.service';
import { DashboardEstudanteSummary } from '../../../../compartilhado/models/dashboard-estudante.model';
Chart.register(...registerables);

@Component({
  selector: 'app-kpis-turma',
  imports: [DecimalPipe, NgClass, DatePipe],
  templateUrl: './kpis-turma.component.html',
  styleUrls: ['./kpis-turma.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpisTurmaComponent implements OnDestroy {
  readonly turmaId = input<string | undefined>();
  readonly isVisaoEscola = input<boolean>(false);
  
  private readonly turmasService = inject(TurmasService);
  
  dashboardData = signal<DashboardEstudanteSummary | null>(null);
  periodo = signal<string>('semana');

  @ViewChild('mediaGaugeCanvas') mediaGaugeCanvas!: ElementRef<HTMLCanvasElement>;
  private mediaChart: Chart | null = null;

  categoriasList = [
    { key: 'Alimentacao', title: 'Alimentação', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M12 2C8.43 2 5.23 3.54 3.01 6L12 22l8.99-16C18.78 3.55 15.57 2 12 2zM7 7c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm5 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z' },
    { key: 'Banheiro', title: 'Banheiro', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm1.5 13H14v-1.5h-2V15H9v-2.5h3v-1.5h2.5V15z' },
    { key: 'Autonomia', title: 'Autonomia', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' },
    { key: 'Comportamento', title: 'Comportamento', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM8.5 8c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zM12 18c-2.28 0-4.22-1.66-5-4h10c-.78 2.34-2.72 4-5 4zm3.5-7c-.83 0-1.5-.67-1.5-1.5S14.67 8 15.5 8s1.5.67 1.5 1.5S16.33 11 15.5 11z' },
    { key: 'Interacao', title: 'Interação Social', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z' },
    { key: 'Foco', title: 'Foco nas Atividades', color: 'text-elo-roxo-principal', bgIcon: 'bg-purple-50', svgPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm4-8c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4zm-4-2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' }
  ];

  constructor() {
    effect(() => {
      const visaoEscola = this.isVisaoEscola();
      const id = this.turmaId();
      const per = this.periodo();

      if (visaoEscola) {
        this.carregarDashboardEscola(per);
      } else if (id) {
        this.carregarDashboard(id, per);
      }
    });
  }

  onPeriodoChange(event: Event) {
    const novoPeriodo = (event.target as HTMLSelectElement).value;
    this.periodo.set(novoPeriodo);
  }

  private carregarDashboard(id: string, periodo: string) {
    this.dashboardData.set(null); 
    this.turmasService.obterKpisTurma(id, periodo).subscribe(data => {
      this.dashboardData.set(data);
      setTimeout(() => this.renderizarGauge(data.mediaGeral.valor), 50);
    });
  }

  private carregarDashboardEscola(periodo: string) {
    this.dashboardData.set(null); 
    this.turmasService.obterKpisEscola(periodo).subscribe(data => {
      this.dashboardData.set(data);
      setTimeout(() => this.renderizarGauge(data.mediaGeral.valor), 50);
    });
  }

  ngOnDestroy(): void {
    if (this.mediaChart) this.mediaChart.destroy();
    if (this.historicoChart) this.historicoChart.destroy();
  }

  private renderizarGauge(valor: number) {
    if (this.mediaChart) {
      this.mediaChart.destroy();
    }

    if (!this.mediaGaugeCanvas) return;

    const canvas = this.mediaGaugeCanvas.nativeElement;
    
    this.mediaChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [valor, 5 - valor],
          backgroundColor: ['#f97316', '#f3f4f6'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '80%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        animation: {
          animateRotate: true,
          animateScale: false
        }
      }
    });
  }

  // --- Lógica do Histórico (Modal) ---
  categoriaSelecionada = signal<string | null>(null);
  semanaAtualVisualizada = signal<Date>(this.obterInicioSemanaAtual());
  private historicoChart: Chart | null = null;

  private descricoesCategorias: Record<string, string> = {
    'Alimentação': 'Avalia a aceitação alimentar do estudante, sua independência ao comer e a presença de eventuais restrições ou seletividades durante as refeições.',
    'Banheiro': 'Acompanha o nível de independência para usar o banheiro, solicitar ajuda quando necessário e realizar sua própria higiene pessoal.',
    'Autonomia': 'Mede a capacidade do estudante de realizar tarefas diárias práticas e de seguir a rotina escolar com o mínimo de suporte físico ou verbal.',
    'Comportamento': 'Observa a regulação emocional perante frustrações, a presença de comportamentos atípicos ou crises e a adequação às regras do ambiente.',
    'Interação Social': 'Avalia a iniciativa para brincar, a capacidade de compartilhar, o contato visual e a comunicação estabelecida com colegas e educadores.',
    'Foco nas Atividades': 'Mede o tempo de atenção sustentada, o engajamento na tarefa em execução e a capacidade de concluir as atividades pedagógicas propostas.'
  };

  obterDescricaoCategoria(categoria: string | null): string {
    if (!categoria || !this.descricoesCategorias[categoria]) {
      return 'Acompanhamento de desenvolvimento da rotina escolar.';
    }
    return this.descricoesCategorias[categoria];
  }

  private obterInicioSemanaAtual(): Date {
    const data = new Date();
    const dia = data.getDay();
    const diff = data.getDate() - dia + (dia === 0 ? -6 : 1);
    data.setDate(diff);
    data.setHours(0, 0, 0, 0);
    return data;
  }

  semanaAtualFim(): Date {
    const inicio = new Date(this.semanaAtualVisualizada());
    inicio.setDate(inicio.getDate() + 4);
    return inicio;
  }

  podeNavegarProximaSemana(): boolean {
    const inicioDestaSemana = this.obterInicioSemanaAtual();
    return this.semanaAtualVisualizada() < inicioDestaSemana;
  }

  abrirDetalheCategoria(categoria: string) {
    this.categoriaSelecionada.set(categoria);
    this.semanaAtualVisualizada.set(this.obterInicioSemanaAtual());
    this.carregarHistorico(categoria);
  }

  fecharDetalheCategoria() {
    this.categoriaSelecionada.set(null);
    if (this.historicoChart) {
      this.historicoChart.destroy();
      this.historicoChart = null;
    }
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

    const strInicio = `${formatarParaDataPura(inicio)}T00:00:00`;
    const strFim = `${formatarParaDataPura(fim)}T23:59:59`;

    const request$ = this.isVisaoEscola()
      ? this.turmasService.obterHistoricoEscola(categoria, strInicio, strFim)
      : this.turmasService.obterHistoricoTurma(this.turmaId()!, categoria, strInicio, strFim);

    request$.subscribe({
      next: (data) => {
        if (data && data.datasets && data.datasets.length > 0) {
          setTimeout(() => this.renderHistoricoChart(data, categoria), 50);
        } else {
          this.tratarGraficoHistoricoVazio(categoria);
        }
      },
      error: (err) => console.error('Erro ao buscar histórico:', err)
    });
  }

  private tratarGraficoHistoricoVazio(categoria: string) {
    setTimeout(() => {
      if (this.historicoChart) this.historicoChart.destroy();
      const canvas = document.getElementById('historicoCanvasTurma') as HTMLCanvasElement;
      if (!canvas) return;
      
      const contexto = canvas.getContext('2d');
      if (contexto) contexto.clearRect(0, 0, canvas.width, canvas.height);
      
      const dadosVazios = {
        labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
        datasets: [{ label: categoria, data: [0, 0, 0, 0, 0] }]
      };
      this.renderHistoricoChart(dadosVazios, categoria);
    }, 50);
  }

  private renderHistoricoChart(data: { labels: string[], datasets: { data: number[] }[] }, categoria: string) {
    const canvas = document.getElementById('historicoCanvasTurma') as HTMLCanvasElement;
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
            data: data.datasets?.[0]?.data || [],
            backgroundColor: '#f97316',
            borderRadius: 20,
            borderSkipped: false,
            barThickness: 16,
            grouped: false,
            order: 1
          },
          {
            label: 'Máximo (5)',
            data: trackBackground,
            backgroundColor: '#fef3c7',
            borderRadius: 20,
            borderSkipped: false,
            barThickness: 16,
            grouped: false,
            order: 2,
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
        plugins: {
          legend: { display: false },
          tooltip: {
            filter: function(tooltipItem) {
              return tooltipItem.dataset.label !== 'Máximo (5)';
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1,
              font: {
                family: "'Inter', sans-serif",
                size: 11
              },
              color: '#9ca3af'
            },
            grid: {
              color: '#f3f4f6',
              drawTicks: false
            },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            ticks: {
              font: {
                family: "'Inter', sans-serif",
                size: 12,
                weight: 'bold'
              },
              color: '#6b7280'
            },
            border: { display: false }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }
}