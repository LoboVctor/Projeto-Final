import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
  PLATFORM_ID,
  OnInit,
  signal,
  effect,
  DestroyRef,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Chart } from 'chart.js/auto';
import { RegistrosDiariosService } from '../../../compartilhado/services/registros-diarios.service';
import { AuthService } from '../../../nucleo/services/auth';
import { RegistroDiarioPendente } from '../../../compartilhado/models/registros-diarios.models';
import { TurmasService, MetricasEscola } from '../../../nucleo/services/turmas.service';
import { TurmaGraficosComponent } from '../../turma/components/turma-graficos/turma-graficos';
import { KpisTurmaComponent } from '../../turma/components/kpis-turma/kpis-turma.component';
import { CalendarioService, EventoCalendario } from '../../../compartilhado/services/calendario.service';
import { DiagLabelPipe } from '../../../compartilhado/pipes/student.pipes';
import { DiagnosticoVisibilidadeService } from '../../../compartilhado/services/diagnostico-visibilidade.service';
import { AuditoriaService } from '../../../nucleo/services/auditoria.service';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

const DIAG_LABEL: Record<string, string> = {
  TEA: 'TEA', TDAH: 'TDAH', SINDROME_DOWN: 'S.DOWN',
  PARALISIA_CEREBRAL: 'PC', DEFICIENCIA_INTELECTUAL: 'DI',
  DEFICIENCIA_MULTIPLA: 'DEMU', OUTRO: 'OUTRO',
};

const SEXO_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  PREFIRO_NAO_INFORMAR: 'Prefiro não responder',
};

const FCOM_LABEL: Record<string, string> = { VERBAL: 'Verbal', NAO_VERBAL: 'Não Verbal' };

@Component({
  selector: 'app-coordenador-home',
  imports: [
    DatePipe,
    DiagLabelPipe,
    TurmaGraficosComponent,
    KpisTurmaComponent,
  ],
  templateUrl: './coordenador-home.component.html',
  styleUrl: './coordenador-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordenadorHomeComponent implements OnInit {

  private readonly registrosService = inject(RegistrosDiariosService);
  private readonly turmasService = inject(TurmasService);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly calendarioService = inject(CalendarioService);
  private readonly router = inject(Router);
  private readonly auditoriaService = inject(AuditoriaService);
  protected readonly diagVis = inject(DiagnosticoVisibilidadeService);

  @ViewChild('relatorioEscola') relatorioEscola!: ElementRef;

  // ── Signals de exportação ──
  exportDropdownAberto = signal(false);
  gerandoPdf = signal(false);
  nomeUsuarioLogado = signal<string>('');
  dataHoraAtual = signal<Date>(new Date());

  // ── Registros e Progresso ─────────────────────────────────────
  registrosPendentes = signal<RegistroDiarioPendente[]>([]);
  dadosProgressoProfessor = signal<{ educador: string; pendentes: number }[]>([]);
  totalEsperado = signal<number>(0);
  totalPreenchidos = signal<number>(0);
  loadingMetricas = signal<boolean>(true);

  totalPendentes = computed(() => this.registrosPendentes().length);
  isModalPendenciasAberto = signal(false);

  // ── Dashboard da escola (Big Numbers do Coordenador) ──────────
  metricasEscola = signal<MetricasEscola | null>(null);
  loadingDashboard = signal(true);
  abaGraficos = signal<'perfil' | 'metricas'>('perfil');

  // ── Big Numbers Animados ──────────────────────────────────────
  totalAlunosAnimado = signal(0);
  totalProfessoresAnimado = signal(0);
  totalTurmasAnimado = signal(0);
  registrosPendentesAnimado = signal(0);

  /** Mapa de IDs de animações ativas para cancelamento */
  private animacoesAtivas: Record<string, number> = {};

  // ── Próximos Eventos ──────────────────────────────────────────
  proximosEventos = signal<EventoCalendario[]>([]);
  loadingEventos = signal(false);

  readonly paginaEventosAtual = signal(0);
  readonly eventosPorPagina = 5;

  readonly totalPaginasEventos = computed(() =>
    Math.ceil(this.proximosEventos().length / this.eventosPorPagina)
  );

  readonly eventosVisiveis = computed(() => {
    const inicio = this.paginaEventosAtual() * this.eventosPorPagina;
    return this.proximosEventos().slice(inicio, inicio + this.eventosPorPagina);
  });

  readonly deveMostrarPaginacaoEventos = computed(() =>
    this.proximosEventos().length > this.eventosPorPagina
  );

  @ViewChild('canvasProgressoProfessor', { static: false }) canvasProgressoProfessor?: ElementRef<HTMLCanvasElement>;
  graficoProgressoProfessor?: Chart;

  @ViewChild('canvasProgressoProfessorModal', { static: false }) canvasProgressoProfessorModal?: ElementRef<HTMLCanvasElement>;
  graficoProgressoProfessorModal?: Chart;

  constructor() {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.nomeUsuarioLogado.set(this.authService.getLoggedUserName());

    const educadorIdAtual = this.authService.getLoggedUserId();
    if (!educadorIdAtual) return;

    // Registros pendentes (com animação)
    this.registrosService
      .getAlertasPendentes(educadorIdAtual)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dados) => {
          this.registrosPendentes.set(dados);
          this.animarNumero(
            dados.length,
            (val) => this.registrosPendentesAnimado.set(val),
            'registrosPendentes',
            { duracao: 800, casasDecimais: 0 }
          );
        },
        error: () => {},
      });

    // Progresso do mês por professor
    this.registrosService
      .getAlertasEscolaPorProfessor()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dados) => {
          this.dadosProgressoProfessor.set(dados);
          this.loadingMetricas.set(false);
          setTimeout(() => this.renderizarProgressoProfessor(dados), 50);
        },
        error: () => this.loadingMetricas.set(false),
      });

    // Métricas da escola — Big Numbers animados
    this.turmasService
      .getDashboardEscola()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dados) => {
          this.metricasEscola.set(dados);
          this.loadingDashboard.set(false);
          this.animarNumero(
            dados.totalAlunos,
            (val) => this.totalAlunosAnimado.set(val),
            'totalAlunos',
            { duracao: 900, casasDecimais: 0 }
          );
          this.animarNumero(
            dados.totalProfessores,
            (val) => this.totalProfessoresAnimado.set(val),
            'totalProfessores',
            { duracao: 900, casasDecimais: 0 }
          );
          this.animarNumero(
            dados.totalTurmas,
            (val) => this.totalTurmasAnimado.set(val),
            'totalTurmas',
            { duracao: 900, casasDecimais: 0 }
          );
        },
        error: () => this.loadingDashboard.set(false),
      });

    this.carregarProximosEventos();
  }

  /** Helper para animar números de 0 até o valor real com suporte SSR e cancelamento de animações anteriores */
  private animarNumero(
    destino: number,
    setValor: (valor: number) => void,
    chave: string,
    opcoes?: { duracao?: number; casasDecimais?: number }
  ): void {
    if (!isPlatformBrowser(this.platformId)) {
      setValor(destino);
      return;
    }

    if (this.animacoesAtivas[chave]) {
      cancelAnimationFrame(this.animacoesAtivas[chave]);
      delete this.animacoesAtivas[chave];
    }

    const duracao = opcoes?.duracao ?? 800;
    const casasDecimais = opcoes?.casasDecimais ?? 0;
    const inicio = 0;
    const tempoInicio = performance.now();

    const passo = (tempoAtual: number) => {
      const tempoDecorrido = tempoAtual - tempoInicio;
      const progresso = Math.min(tempoDecorrido / duracao, 1);
      // easeOutQuad
      const progressoSuave = progresso * (2 - progresso);
      const valorAtual = inicio + (destino - inicio) * progressoSuave;
      setValor(Number(valorAtual.toFixed(casasDecimais)));
      this.cdr.markForCheck();

      if (progresso < 1) {
        this.animacoesAtivas[chave] = requestAnimationFrame(passo);
      } else {
        setValor(destino);
        this.cdr.markForCheck();
        delete this.animacoesAtivas[chave];
      }
    };

    this.animacoesAtivas[chave] = requestAnimationFrame(passo);
  }

  carregarProximosEventos(): void {
    const schoolId = this.authService.getEscolaId();
    if (!schoolId) return;

    this.loadingEventos.set(true);
    this.calendarioService
      .buscarProximosEventos(schoolId, 30)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (eventos) => {
          this.proximosEventos.set(eventos);
          this.loadingEventos.set(false);
        },
        error: () => this.loadingEventos.set(false),
      });
  }

  // ── Modais e Navegação ────────────────────────────────────────

  abrirModal(): void {
    this.isModalPendenciasAberto.set(true);
    setTimeout(() => {
      this.renderizarProgressoProfessorModal(this.dadosProgressoProfessor());
    }, 50);
  }

  fecharModal(): void {
    this.isModalPendenciasAberto.set(false);
    if (this.graficoProgressoProfessorModal) {
      this.graficoProgressoProfessorModal.destroy();
      this.graficoProgressoProfessorModal = undefined;
    }
  }

  trocarAbaGraficos(aba: 'perfil' | 'metricas'): void {
    this.abaGraficos.set(aba);
  }

  irParaCalendarioDoEvento(evento: EventoCalendario): void {
    const dataStr = evento.dataEvento.substring(0, 10);
    this.router.navigate(['coordenador/calendario'], {
      queryParams: { data: dataStr, eventoId: evento.id },
    });
  }

  // ── Paginação de Eventos ──────────────────────────────────────

  proximaPaginaEventos(): void {
    if (this.paginaEventosAtual() < this.totalPaginasEventos() - 1) {
      this.paginaEventosAtual.update((p) => p + 1);
    }
  }

  paginaAnteriorEventos(): void {
    if (this.paginaEventosAtual() > 0) {
      this.paginaEventosAtual.update((p) => p - 1);
    }
  }

  // ── Ações Rápidas (navegação com abertura de modal) ─────────────

  /** Navega para a tela de Alunos e sinaliza para abrir o dropdown de cadastro */
  irParaCadastrarAluno(): void {
    this.router.navigate(['/coordenador/alunos'], { queryParams: { abrirModal: 'true' } });
  }

  /** Navega para a tela de Professores e sinaliza para abrir o dropdown de cadastro */
  irParaCadastrarProfessor(): void {
    this.router.navigate(['/coordenador/professores'], { queryParams: { abrirModal: 'true' } });
  }

  /** Navega para o Calendário e sinaliza para abrir o modal de novo evento */
  irParaAdicionarEvento(): void {
    this.router.navigate(['/coordenador/calendario'], { queryParams: { abrirModal: 'true' } });
  }

  private renderizarProgressoProfessor(dados: { educador: string; pendentes: number }[]): void {
    if (!this.canvasProgressoProfessor) return;

    const dadosTop6 = dados.slice(0, 6);

    const datasets = [{
      label: 'Registros Pendentes',
      data: dadosTop6.map(d => d.pendentes),
      backgroundColor: '#f97316',
      borderWidth: 2,      
      borderColor: '#ffffff',
      borderRadius: 4,      
      borderSkipped: false,
      barPercentage: 0.6    
    }];

    if (this.graficoProgressoProfessor) {
      this.graficoProgressoProfessor.data.labels = dadosTop6.map(d => d.educador);
      this.graficoProgressoProfessor.data.datasets = datasets;
      this.graficoProgressoProfessor.update();
    } else {
      this.graficoProgressoProfessor = new Chart(this.canvasProgressoProfessor.nativeElement, {
        type: 'bar',
        data: {
          labels: dadosTop6.map(d => d.educador), 
          datasets,
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 30 } }, 
          scales: {
            x: { display: false, grid: { display: false }, border: { display: false } },
            y: { display: true, grid: { display: false }, border: { display: false }, ticks: { font: { family: 'Nunito', size: 14 }, crossAlign: 'far' } }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.raw} pendentes`
              }
            }
          }
        },
        plugins: [
          {
            id: 'barraFrequenciaLabels',
            afterDatasetsDraw: (chart) => {
              const { ctx } = chart;
              chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                meta.data.forEach((bar, index) => {
                  const data = dataset.data[index] as number;
                  ctx.fillStyle = '#686177'; 
                  ctx.font = 'bold 12px Nunito';
                  ctx.textBaseline = 'middle';
                  ctx.textAlign = 'left';
                  ctx.fillText(data.toString(), bar.x + 8, bar.y);
                });
              });
            }
          }
        ]
      });
    }
  }

  private renderizarProgressoProfessorModal(dados: { educador: string; pendentes: number }[]): void {
    if (!this.canvasProgressoProfessorModal) return;

    const dadosTop10 = dados.slice(0, 10);

    const datasets = [{
      label: 'Registros Pendentes',
      data: dadosTop10.map(d => d.pendentes),
      backgroundColor: '#f97316',
      borderWidth: 2,      
      borderColor: '#ffffff',
      borderRadius: 4,      
      borderSkipped: false,
      barPercentage: 0.6    
    }];

    if (this.graficoProgressoProfessorModal) {
      this.graficoProgressoProfessorModal.data.labels = dadosTop10.map(d => d.educador);
      this.graficoProgressoProfessorModal.data.datasets = datasets;
      this.graficoProgressoProfessorModal.update();
    } else {
      this.graficoProgressoProfessorModal = new Chart(this.canvasProgressoProfessorModal.nativeElement, {
        type: 'bar',
        data: {
          labels: dadosTop10.map(d => d.educador), 
          datasets,
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { right: 30 } },
          scales: {
            x: { display: true, grid: { display: false }, border: { display: false }, title: { display: true, text: 'Nº de Pendências', font: { family: 'Nunito' } } },
            y: { display: true, grid: { display: false }, border: { display: false }, ticks: { font: { family: 'Nunito', size: 14 }, crossAlign: 'far' } }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` ${context.raw} pendentes`
              }
            }
          }
        },
        plugins: [
          {
            id: 'barraFrequenciaLabelsModal',
            afterDatasetsDraw: (chart) => {
              const { ctx } = chart;
              chart.data.datasets.forEach((dataset, i) => {
                const meta = chart.getDatasetMeta(i);
                meta.data.forEach((bar, index) => {
                  const data = dataset.data[index] as number;
                  ctx.fillStyle = '#686177';
                  ctx.font = 'bold 12px Nunito';
                  ctx.textBaseline = 'middle';
                  ctx.textAlign = 'left';
                  ctx.fillText(data.toString(), bar.x + 8, bar.y);
                });
              });
            }
          }
        ]
      });
    }
  }

  // ── Lógica de exportação (mesmo padrão de Turmas/Coordenador-Turmas) ──

  toggleExportDropdown(): void {
    this.exportDropdownAberto.update(v => !v);
  }

  exportarCSV(): void {
    this.exportDropdownAberto.set(false);
    const m = this.metricasEscola();
    if (!m) return;

    this.dataHoraAtual.set(new Date());
    const dataAtual = this.dataHoraAtual().toLocaleDateString('pt-BR');
    const horaAtual = this.dataHoraAtual().toLocaleTimeString('pt-BR');

    let csv = '﻿';
    csv += `RELATÓRIO DE PERFIL DO CEE\n`;
    csv += `Data de Geração:;${dataAtual} às ${horaAtual}\n`;
    csv += `Gerado por:;${this.nomeUsuarioLogado()}\n\n`;

    csv += `RESUMO GERAL\n`;
    csv += `Métrica;Valor\n`;
    csv += `Total de Alunos;${m.totalAlunos}\n`;
    csv += `Total de Professores;${m.totalProfessores}\n`;
    csv += `Total de Turmas;${m.totalTurmas}\n`;
    csv += `Idade Predominante;${m.idadePredominante !== null ? m.idadePredominante + ' anos' : '—'}\n`;
    csv += `Diagnóstico Principal;${m.diagnosticoPrincipal ? (DIAG_LABEL[m.diagnosticoPrincipal] ?? m.diagnosticoPrincipal) : '—'}\n`;
    csv += `Comunicação Principal;${m.comunicacaoPrincipal ? (FCOM_LABEL[m.comunicacaoPrincipal] ?? m.comunicacaoPrincipal) : '—'}\n\n`;

    csv += `DISTRIBUIÇÃO POR SEXO\n`;
    csv += `Sexo;Quantidade\n`;
    m.distribuicaoSexo.forEach(d => {
      csv += `${SEXO_LABEL[d.sexo] ?? d.sexo};${d.quantidade}\n`;
    });
    csv += '\n';

    csv += `DISTRIBUIÇÃO POR IDADE\n`;
    csv += `Idade;Quantidade de Alunos\n`;
    m.distribuicaoIdade.forEach(d => {
      csv += `${d.idade} anos;${d.quantidade}\n`;
    });
    csv += '\n';

    csv += `DISTRIBUIÇÃO POR DIAGNÓSTICO\n`;
    csv += `Diagnóstico;Quantidade de Alunos\n`;
    m.distribuicaoDiagnostico.forEach(d => {
      csv += `${DIAG_LABEL[d.tipo] ?? d.tipo};${d.quantidade}\n`;
    });
    csv += '\n';

    csv += `DISTRIBUIÇÃO POR FORMA DE COMUNICAÇÃO\n`;
    csv += `Forma de Comunicação;Quantidade de Alunos\n`;
    m.distribuicaoComunicacao.forEach(d => {
      csv += `${FCOM_LABEL[d.forma] ?? d.forma};${d.quantidade}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `perfil_cee_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.auditoriaService.registrarDownload('CEE_METRICAS', 'CSV', 'escola').subscribe();
  }

  async exportarPDF(): Promise<void> {
    this.exportDropdownAberto.set(false);
    this.dataHoraAtual.set(new Date());
    this.gerandoPdf.set(true);

    // Aguarda o overlay de carregamento aparecer e os gráficos estabilizarem
    await new Promise(resolve => setTimeout(resolve, 300));

    const elemento = this.relatorioEscola.nativeElement as HTMLElement;
    const cabecalhoPdf = document.getElementById('cabecalho-relatorio-escola-pdf');
    const botoesEsconder = elemento.querySelectorAll('.esconder-no-pdf');

    // Mostra o cabeçalho de impressão e esconde botões interativos
    if (cabecalhoPdf) cabecalhoPdf.classList.remove('hidden');
    botoesEsconder.forEach(el => (el as HTMLElement).style.display = 'none');

    // ── Fix: Canvas em branco — mesmo padrão do BlocoDashboardComponent ──
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

    // ── Fix: Altura cortada pelo overflow-y: auto (elemento raiz + scroll interno das abas) ──
    const estiloOriginalOverflow = elemento.style.overflow;
    const estiloOriginalMaxH = elemento.style.maxHeight;
    const estiloOriginalMinH = elemento.style.minHeight;
    elemento.style.overflow = 'visible';
    elemento.style.maxHeight = 'none';
    elemento.style.minHeight = 'auto';

    const scrollInternos = Array.from(
      elemento.querySelectorAll<HTMLElement>('.overflow-y-auto, .overflow-auto')
    );
    const estilosScrollInternos = scrollInternos.map(el => ({
      overflow: el.style.overflow,
      maxHeight: el.style.maxHeight,
    }));
    scrollInternos.forEach(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    });

    try {
      const imgData = await toPng(elemento, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: elemento.scrollWidth,
        height: elemento.scrollHeight,
        style: { overflow: 'visible', maxHeight: 'none' },
      });

      const larguraPDF = new jsPDF('p', 'mm', 'a4').internal.pageSize.getWidth();
      const alturaPDF = (elemento.scrollHeight * larguraPDF) / elemento.scrollWidth;

      const pdfDinamico = new jsPDF('p', 'mm', [larguraPDF, alturaPDF]);
      pdfDinamico.addImage(imgData, 'PNG', 0, 0, larguraPDF, alturaPDF);

      pdfDinamico.save('Relatorio_CEE.pdf');
      this.auditoriaService.registrarDownload('RELATORIO_CEE', 'PDF', 'escola').subscribe();

    } catch (erro) {
      console.error('Erro ao gerar PDF do CEE:', erro);
      alert('Não foi possível gerar o PDF no momento.');
    } finally {
      // Restaura o DOM independentemente de sucesso ou falha
      for (const { canvas, img } of overlays) {
        canvas.style.opacity = '';
        img.remove();
      }
      elemento.style.overflow = estiloOriginalOverflow;
      elemento.style.maxHeight = estiloOriginalMaxH;
      elemento.style.minHeight = estiloOriginalMinH;
      scrollInternos.forEach((el, i) => {
        const original = estilosScrollInternos[i];
        if (!original) return;
        el.style.overflow = original.overflow;
        el.style.maxHeight = original.maxHeight;
      });

      if (cabecalhoPdf) cabecalhoPdf.classList.add('hidden');
      botoesEsconder.forEach(el => (el as HTMLElement).style.display = '');
      this.gerandoPdf.set(false);
    }
  }
}
