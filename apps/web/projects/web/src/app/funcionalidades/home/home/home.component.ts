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
import { isPlatformBrowser, DatePipe, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { TurmasService, TurmaResumo, EstudanteResumo } from '../../../nucleo/services/turmas.service';
import { CardAlunoComponent } from '../../../compartilhado/components/card-aluno/card-aluno';
import { AlunoModalComponent } from '../../../compartilhado/components/aluno-modal/aluno-modal.component';
import { AlunoModalData } from '../../../compartilhado/models/aluno-modal.model';
import { CalendarioService, EventoCalendario } from '../../../compartilhado/services/calendario.service';
import { buildAlunoModalData, getDiagnosticosArrayForCard, buildFotoUrl } from '../../../compartilhado/utils/aluno-modal.utils';
import { API_BASE_URL } from '../../../nucleo/config/api.config';
import { DiagnosticoVisibilidadeService } from '../../../compartilhado/services/diagnostico-visibilidade.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
};

type AcaoRapida = 'novo-relatorio' | 'score-dia' | 'dashboard-aluno';
type AbaDestinoAluno = 'relatorios' | 'agenda' | 'dashboard';

export interface PendentePorAluno {
  estudanteId: string;
  nomeCompleto: string;
  foto: string;
  datas: { data: string; label: string }[];
}

@Component({
  selector: 'app-home',
  imports: [NgApexchartsModule, CardAlunoComponent, AlunoModalComponent, DatePipe, DecimalPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions;

  private readonly registrosService = inject(RegistrosDiariosService);
  private readonly turmasService = inject(TurmasService);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly diagVis = inject(DiagnosticoVisibilidadeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly calendarioService = inject(CalendarioService);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly router = inject(Router);

  registrosPendentes = signal<RegistroDiarioPendente[]>([]);
  totalEsperado = signal<number>(0);
  totalPreenchidos = signal<number>(0);
  totalAlunosEducador = signal<number>(0);
  scoreMedioHoje = signal<number>(0);
  diaDaSemanaTexto = signal<string>('Hoje');
  loadingMetricas = signal<boolean>(true);

  turmaAtual = signal<TurmaResumo | null>(null);
  estudantes = signal<EstudanteResumo[]>([]);
  loadingEstudantes = signal(false);
  erroEstudantes = signal<string | null>(null);
  alunoEmDestaque = signal<AlunoModalData | null>(null);

  proximosEventos = signal<EventoCalendario[]>([]);
  loadingEventos = signal(false);

  totalPendentes = computed(() => this.registrosPendentes().length);

  totalAlunosAnimado = signal(0);
  scoreMedioHojeAnimado = signal(0);
  registrosPendentesAnimado = signal(0);

  private animacoesAtivas: Record<string, number> = {};

  acaoRapidaSelecionada = signal<AcaoRapida | null>(null);
  modalSelecaoAluno = signal(false);
  abaDestino = signal<AbaDestinoAluno | null>(null);

  readonly paginaEventosAtual = signal(0);
  readonly eventosPorPagina = 2;

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

  paginaAtual = signal(0);
  readonly ALUNOS_POR_PAGINA = 5;

  alunosPaginados = computed(() => {
    const inicio = this.paginaAtual() * this.ALUNOS_POR_PAGINA;
    return this.estudantes().slice(inicio, inicio + this.ALUNOS_POR_PAGINA);
  });

  totalPaginas = computed(() =>
    Math.ceil(this.estudantes().length / this.ALUNOS_POR_PAGINA)
  );

  paginasArray(): number[] {
    return Array.from({ length: this.totalPaginas() }, (_, i) => i);
  }

  // --- Painel de Registros Pendentes ---
  painelPendenciasAberto = signal(false);
  alunoExpandidoId = signal<string | null>(null);

  readonly pendentesAgrupados = computed<PendentePorAluno[]>(() => {
    const mapa = new Map<string, PendentePorAluno>();
    const formatador = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    for (const reg of this.registrosPendentes()) {
      let label = reg.data;
      try {
        const dataObj = new Date(reg.data);
        if (!isNaN(dataObj.getTime())) {
          let formatada = formatador.format(dataObj);
          label = formatada.charAt(0).toUpperCase() + formatada.slice(1);
        }
      } catch (e) {
        // Fallback to original string if error
      }

      const pendenciaObj = { data: reg.data, label };
      const entry = mapa.get(reg.estudanteId);

      if (entry) {
        entry.datas.push(pendenciaObj);
      } else {
        const alunoReal = this.estudantes().find(
          (aluno) => aluno.id === reg.estudanteId || aluno.nomeCompleto === reg.estudante.nomeCompleto
        );
        mapa.set(reg.estudanteId, {
          estudanteId: reg.estudanteId,
          nomeCompleto: reg.estudante.nomeCompleto,
          foto: alunoReal?.foto || reg.estudante.foto,
          datas: [pendenciaObj],
        });
      }
    }
    return Array.from(mapa.values());
  });

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
        esperado > 0 ? Math.min(100, Math.round((preenchidos / esperado) * 100)) : 100;

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
    if (!educadorIdAtual) return;

    this.turmasService.getBigNumbersHome(educadorIdAtual)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dados) => {
          this.totalAlunosEducador.set(dados.totalAlunos);
          this.scoreMedioHoje.set(dados.scoreMedioDia);

          this.animarNumero(dados.totalAlunos, (val) => this.totalAlunosAnimado.set(val), 'totalAlunos', { duracao: 800, casasDecimais: 0 });
          this.animarNumero(dados.scoreMedioDia, (val) => this.scoreMedioHojeAnimado.set(val), 'scoreMedio', { duracao: 800, casasDecimais: 1 });

          const diasExtras = [
            'Domingo',
            'Segunda-feira',
            'Terça-feira',
            'Quarta-feira',
            'Quinta-feira',
            'Sexta-feira',
            'Sábado'
          ];
          if (dados.diaDaSemana >= 0 && dados.diaDaSemana <= 6) {
            const diaTexto = diasExtras[dados.diaDaSemana] ?? 'Hoje';
            this.diaDaSemanaTexto.set(diaTexto);
          }
        },
        error: (err: unknown) => {
          console.error('Erro ao buscar Big Numbers', err);
        }
      });

    this.registrosService
      .getAlertasPendentes(educadorIdAtual)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pendentes) => {
          this.registrosPendentes.set(pendentes);
          this.animarNumero(pendentes.length, (val) => this.registrosPendentesAnimado.set(val), 'registrosPendentes', { duracao: 800, casasDecimais: 0 });
        },
        error: () => { }
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

    this.carregarTurmaEEstudantes(educadorIdAtual);
    this.carregarProximosEventos();
  }

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
      const progressoSuave = progresso * (2 - progresso);

      const valorAtual = inicio + (destino - inicio) * progressoSuave;
      const valorFormatado = Number(valorAtual.toFixed(casasDecimais));
      setValor(valorFormatado);

      if (progresso < 1) {
        this.animacoesAtivas[chave] = requestAnimationFrame(passo);
      } else {
        setValor(destino);
        delete this.animacoesAtivas[chave];
      }
    };

    this.animacoesAtivas[chave] = requestAnimationFrame(passo);
  }

  carregarTurmaEEstudantes(educadorId: string): void {
    this.loadingEstudantes.set(true);
    this.erroEstudantes.set(null);

    this.turmasService.getTurmas(educadorId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (turmas) => {
        if (turmas.length > 0 && turmas[0]) {
          this.turmaAtual.set(turmas[0]);
          this.turmasService.getEstudantesDaTurma(turmas[0].id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (res) => {
              this.estudantes.set(res.estudantes);
              this.paginaAtual.set(0);
              this.loadingEstudantes.set(false);
            },
            error: () => {
              this.erroEstudantes.set('Erro ao carregar os alunos da turma.');
              this.loadingEstudantes.set(false);
            }
          });
        } else {
          this.loadingEstudantes.set(false);
        }
      },
      error: () => {
        this.erroEstudantes.set('Erro ao carregar as turmas.');
        this.loadingEstudantes.set(false);
      }
    });
  }

  abrirDetalhesAluno(estudante: EstudanteResumo): void {
    this.abaDestino.set(null);
    const nomeDaTurma = this.turmaAtual()?.nome || 'Turma Indefinida';
    const diagnosticoPrincipal = estudante.diagnosticos.length > 0
      ? estudante.diagnosticos[0]?.diagnostico?.tipo || 'Sem Laudo'
      : 'Sem Laudo';

    this.alunoEmDestaque.set({
      id: estudante.id,
      nome: estudante.nomeCompleto,
      turma: nomeDaTurma,
      diagnostico: diagnosticoPrincipal,
      nivelSuporte: 'Nível 1 de Suporte',
      foto: estudante.foto || `https://ui-avatars.com/api/?name=${estudante.nomeCompleto}&background=F0E6FF&color=4A148C`
    });
  }

  fecharAlunoModal(houveModificacao: boolean = false): void {
    this.alunoEmDestaque.set(null);
    this.abaDestino.set(null);
    if (houveModificacao) {
      this.carregarTurmaEEstudantes(this.authService.getLoggedUserId() ?? '');
    }
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
        error: () => this.loadingEventos.set(false)
      });
  }

  nomeCurtoAluno(nomeCompleto: string): string {
    if (!nomeCompleto) return '';
    const partes = nomeCompleto.trim().split(/\s+/);
    if (partes.length <= 2) return nomeCompleto;
    return `${partes[0]} ${partes[partes.length - 1]}`;
  }

  proximaPagina(): void {
    if (this.paginaAtual() < this.totalPaginas() - 1) {
      this.paginaAtual.update(p => p + 1);
    }
  }

  paginaAnterior(): void {
    if (this.paginaAtual() > 0) {
      this.paginaAtual.update(p => p - 1);
    }
  }

  proximaPaginaEventos(): void {
    if (this.paginaEventosAtual() < this.totalPaginasEventos() - 1) {
      this.paginaEventosAtual.update(p => p + 1);
    }
  }

  paginaAnteriorEventos(): void {
    if (this.paginaEventosAtual() > 0) {
      this.paginaEventosAtual.update(p => p - 1);
    }
  }

  irParaCalendarioDoEvento(evento: EventoCalendario): void {
    const dataStr = evento.dataEvento.substring(0, 10);
    this.router.navigate(['/calendario'], {
      queryParams: {
        data: dataStr,
        eventoId: evento.id,
      },
    });
  }

  abrirSelecaoAluno(acao: AcaoRapida): void {
    this.acaoRapidaSelecionada.set(acao);
    this.modalSelecaoAluno.set(true);
  }

  fecharSelecaoAluno(): void {
    this.modalSelecaoAluno.set(false);
    this.acaoRapidaSelecionada.set(null);
  }

  selecionarAlunoDaAcao(estudante: EstudanteResumo): void {
    const acao = this.acaoRapidaSelecionada();
    let aba: AbaDestinoAluno = 'relatorios';

    if (acao === 'score-dia') {
      aba = 'agenda';
    } else if (acao === 'dashboard-aluno') {
      aba = 'dashboard';
    }

    this.modalSelecaoAluno.set(false);
    this.acaoRapidaSelecionada.set(null);
    this.abaDestino.set(aba);

    this.alunoEmDestaque.set(buildAlunoModalData(estudante, this.baseUrl));
  }

  getDiagnosticosCard(estudante: EstudanteResumo): string[] {
    return getDiagnosticosArrayForCard(estudante.diagnosticos);
  }

  getFotoUrlCard(estudante: EstudanteResumo): string {
    return buildFotoUrl(estudante.nomeCompleto, estudante.foto, this.baseUrl);
  }

  // --- Painel de Registros Pendentes ---

  abrirPainelPendencias(): void {
    this.painelPendenciasAberto.update(v => !v);
    this.alunoExpandidoId.set(null);
  }

  toggleAlunoExpandido(estudanteId: string): void {
    this.alunoExpandidoId.update(atual =>
      atual === estudanteId ? null : estudanteId
    );
  }

  abrirAgendaAluno(pendente: PendentePorAluno): void {
    this.abaDestino.set('agenda');
    this.painelPendenciasAberto.set(false);
    this.alunoExpandidoId.set(null);

    const nomeDaTurma = this.turmaAtual()?.nome || 'Turma Indefinida';
    this.alunoEmDestaque.set({
      id: pendente.estudanteId,
      nome: pendente.nomeCompleto,
      turma: nomeDaTurma,
      diagnostico: 'Sem Laudo',
      nivelSuporte: 'Nível 1 de Suporte',
      foto: buildFotoUrl(pendente.nomeCompleto, pendente.foto, this.baseUrl),
    });
  }

  avatarUrlPendente(pendente: PendentePorAluno): string {
    return buildFotoUrl(pendente.nomeCompleto, pendente.foto, this.baseUrl);
  }
}
