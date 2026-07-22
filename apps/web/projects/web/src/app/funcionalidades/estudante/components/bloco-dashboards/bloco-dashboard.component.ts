import { Component, ChangeDetectionStrategy, ElementRef, ViewChild, effect, inject, input, output, signal, computed, OnInit } from '@angular/core';
import { NgClass, DatePipe, DecimalPipe } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { AnalyticsService } from '../../../../compartilhado/services/analytics.service';
import { AuditoriaService } from '../../../../nucleo/services/auditoria.service';
import { AuthService } from '../../../../nucleo/services/auth';
import Chart from 'chart.js/auto';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { LoadingFlorComponent } from '../../../../compartilhado/components/loading-flor/loading-flor.component';

@Component({
  selector: 'app-bloco-dashboard',
  imports: [NgClass, DatePipe, DecimalPipe, LoadingFlorComponent],
  templateUrl: './bloco-dashboard.component.html',
  styleUrls: ['./bloco-dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlocoDashboardComponent implements OnInit {
  readonly estudanteId = input.required<string>();
  /** Nome do estudante — usado nos nomes dos arquivos exportados */
  readonly nomeEstudante = input<string>('');
  readonly recolher = output<void>();

  private analyticsService = inject(AnalyticsService);
  private readonly auditoriaService = inject(AuditoriaService);
  private readonly authService = inject(AuthService);

  periodo = signal<'semana' | 'mes' | 'semestre'>('mes');
  categoriaSelecionada = signal<string | null>(null);
  semanaAtualVisualizada = signal<Date>(this.getMonday(new Date()));

  // Novos Signals para a exportação
  nomeUsuarioLogado = signal<string>('');
  dataHoraAtual = signal<Date>(new Date());

  labelNavegadorSemana = computed<string>(() => {
    const inicio = this.semanaAtualVisualizada();
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 4);

    const fmt = (d: Date): string => {
      const dia = d.getDate().toString().padStart(2, '0');
      const mes = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${dia}/${mes}`;
    };

    return `${fmt(inicio)} a ${fmt(fim)}`;
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
    switchMap(p => this.analyticsService.getDashboardSummary(this.estudanteId(), p)),
    catchError(() => of(null))
  );
  dashboardData = toSignal(this.dashboardResumo$);

  constructor() {
    this.nomeUsuarioLogado.set(this.authService.getLoggedUserName());
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

  ngOnInit() {
    // Busca o nome do usuário assim que o componente carrega
    this.nomeUsuarioLogado.set(this.authService.getLoggedUserName());
  }

  onRecolher() {
    this.recolher.emit();
  }

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
    this.semanaAtualVisualizada.set(this.getMonday(new Date())); 
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

    const strInicio = `${formatarParaDataPura(inicio)}T00:00:00`;
    const strFim = `${formatarParaDataPura(fim)}T23:59:59`;

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
      this.estudanteId(),
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

  private renderHistoricoChart(data: { labels: string[], datasets: { data: number[] }[] }, categoria: string) {
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
            data: data.datasets?.[0]?.data || [],
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

  // --- Lógica de exportação ---
  @ViewChild('relatorioDashboard') relatorioDashboard!: ElementRef;

  exportDropdownAberto = signal(false);
  gerandoPdf = signal(false);
  dataGeracao = signal('');

  toggleExportDropdown() {
    this.exportDropdownAberto.update(v => !v);
  }

  exportarCSV() {
    this.exportDropdownAberto.set(false);
    const data = this.dashboardData();
    if (!data) return;

    // Atualiza a hora da geração
    this.dataHoraAtual.set(new Date());

    const dataAtual = this.dataHoraAtual().toLocaleDateString('pt-BR');
    const horaAtual = this.dataHoraAtual().toLocaleTimeString('pt-BR');
    const periodoLabel = this.periodo() === 'semana' ? 'Últimos 7 dias' : this.periodo() === 'mes' ? 'Últimos 30 dias' : 'Último Semestre';

    let csv = '\ufeff'; 
    
    csv += `RELATÓRIO DE DESEMPENHO ANALÍTICO\n`;
    csv += `Aluno:;${this.nomeEstudante() || '—'}\n`;
    csv += `Data de Geração:;${dataAtual} às ${horaAtual}\n`;
    csv += `Gerado por:;${this.nomeUsuarioLogado()}\n`;
    csv += `Período Analisado:;${periodoLabel}\n\n`;

    csv += `VISÃO GERAL\n`;
    csv += `Métrica;Valor;Variação Anterior\n`;
    csv += `Média Geral;${data.mediaGeral.valor.toFixed(2)};${data.mediaGeral.variacao >= 0 ? '+' : ''}${data.mediaGeral.variacao.toFixed(2)}\n`;
    csv += `Frequência;${data.frequencia.valor}%;${data.frequencia.variacao >= 0 ? '+' : ''}${data.frequencia.variacao.toFixed(2)}%\n\n`;

    csv += `DETALHAMENTO POR CATEGORIA\n`;
    csv += `Categoria;Score (0 a 5);Variação;Descrição do Eixo Avaliado\n`;

    const nomes: Record<string, string> = {
      'Alimentacao': 'Alimentação', 'Banheiro': 'Banheiro', 'Autonomia': 'Autonomia',
      'Comportamento': 'Comportamento', 'Interacao': 'Interação Social', 'Foco': 'Foco nas Atividades'
    };

    Object.keys(data.categorias).forEach(key => {
      const cat = data.categorias[key];
      if (!cat) return;
      const nomeCorreto = nomes[key] || key;
      const descricao = this.descricoesCategorias[nomeCorreto] || '';

      csv += `${nomeCorreto};${cat.valor.toFixed(2)};${cat.variacao >= 0 ? '+' : ''}${cat.variacao.toFixed(2)};"${descricao}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Relatorio_Dashboard_${this.nomeEstudante() ? this.nomeEstudante().replace(/\s+/g, '_') + '_' : ''}${this.periodo()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    this.auditoriaService.registrarDownload('RELATORIO_DASHBOARD', 'CSV', this.buildDetalhes()).subscribe();
  }

  async exportarPDF() {
    this.exportDropdownAberto.set(false);
    this.dataHoraAtual.set(new Date());
    this.gerandoPdf.set(true);

    // Aguarda o dropdown fechar, o overlay de carregamento aparecer e os gráficos estabilizarem
    await new Promise(resolve => setTimeout(resolve, 300));

    const elemento = this.relatorioDashboard.nativeElement as HTMLElement;
    const cabecalhoPdf = document.getElementById('cabecalho-relatorio-pdf');
    const botoesEsconder = document.querySelectorAll('.esconder-no-pdf');

    // Mostra o cabeçalho de impressão e esconde botões interativos
    if (cabecalhoPdf) cabecalhoPdf.classList.remove('hidden');
    botoesEsconder.forEach(el => (el as HTMLElement).style.display = 'none');

    // ── Fix 1: Canvas em branco ──────────────────────────────────────────────
    const canvasList = Array.from(elemento.querySelectorAll('canvas')) as HTMLCanvasElement[];
    const overlays: { canvas: HTMLCanvasElement; img: HTMLImageElement }[] = [];

    for (const canvas of canvasList) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.position = 'absolute';
        img.style.top = canvas.offsetTop + 'px';
        img.style.left = canvas.offsetLeft + 'px';
        img.style.width = canvas.offsetWidth + 'px';
        img.style.height = canvas.offsetHeight + 'px';
        img.style.pointerEvents = 'none';
        canvas.parentElement?.appendChild(img);
        canvas.style.opacity = '0';
        overlays.push({ canvas, img });
      } catch { /* tainted canvas — skip */ }
    }

    // ── Fix 2: Altura cortada pelo overflow-y: auto ──────────────────────────
    const estiloOriginalOverflow = elemento.style.overflow;
    const estiloOriginalMaxH = elemento.style.maxHeight;
    elemento.style.overflow = 'visible';
    elemento.style.maxHeight = 'none';

    // Removemos a filtragem de esconder-no-pdf daqui, porque já os escondemos via display: none acima
    try {
      const imgData = await toPng(elemento, {
        pixelRatio: 2,
        backgroundColor: '#f8fafc',
        width: elemento.scrollWidth,
        height: elemento.scrollHeight,
        style: { overflow: 'visible', maxHeight: 'none' },
      });

      const larguraPDF = new jsPDF('p', 'mm', 'a4').internal.pageSize.getWidth();
      const alturaPDF = (elemento.scrollHeight * larguraPDF) / elemento.scrollWidth;

      const pdfDinamico = new jsPDF('p', 'mm', [larguraPDF, alturaPDF]);
      pdfDinamico.addImage(imgData, 'PNG', 0, 0, larguraPDF, alturaPDF);

      pdfDinamico.save(`Relatorio_Dashboard_${this.nomeEstudante() ? this.nomeEstudante().replace(/\s+/g, '_') + '_' : ''}${this.periodo()}.pdf`);
      this.auditoriaService.registrarDownload('RELATORIO_DASHBOARD', 'PDF', this.buildDetalhes()).subscribe();

    } catch (erro) {
      console.error('Erro ao gerar PDF:', erro);
      alert('Não foi possível gerar o PDF no momento.');
    } finally {
      // Restaura o DOM independentemente de sucesso ou falha
      for (const { canvas, img } of overlays) {
        canvas.style.opacity = '';
        img.remove();
      }
      elemento.style.overflow = estiloOriginalOverflow;
      elemento.style.maxHeight = estiloOriginalMaxH;

      // Esconde o cabeçalho novamente e mostra os botões
      if (cabecalhoPdf) cabecalhoPdf.classList.add('hidden');
      botoesEsconder.forEach(el => (el as HTMLElement).style.display = '');
      this.gerandoPdf.set(false);
    }
  }

  private buildDetalhes(): string {
    return `periodo=${this.periodo()}; estudanteId=${this.estudanteId()}; nomeEstudante=${this.nomeEstudante()}`;
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

  private renderRadarChart(categorias: Record<string, { valor?: number, valorAnterior?: number, variacao?: number }>) {
    const canvas = document.getElementById('radarCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.radarChart) this.radarChart.destroy();
    
    const obterAnterior = (cat?: { valor?: number, valorAnterior?: number, variacao?: number }) => {
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
              categorias['Alimentacao']?.valor || 0, 
              categorias['Banheiro']?.valor || 0, 
              categorias['Autonomia']?.valor || 0, 
              categorias['Comportamento']?.valor || 0, 
              categorias['Interacao']?.valor || 0, 
              categorias['Foco']?.valor || 0
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
              obterAnterior(categorias['Alimentacao']), 
              obterAnterior(categorias['Banheiro']), 
              obterAnterior(categorias['Autonomia']), 
              obterAnterior(categorias['Comportamento']), 
              obterAnterior(categorias['Interacao']), 
              obterAnterior(categorias['Foco'])
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