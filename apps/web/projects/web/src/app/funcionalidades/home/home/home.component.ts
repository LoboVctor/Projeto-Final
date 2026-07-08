import {
  Component,
  ViewChild,
  inject,
  computed,
  PLATFORM_ID,
  OnInit,
  signal,
  effect,
  DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { isPlatformBrowser, DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NgApexchartsModule,
  ChartComponent,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexChart,
  ApexFill } from 'ng-apexcharts';
import { RegistrosDiariosService } from '../../../compartilhado/services/registros-diarios.service';
import { AuthService } from '../../../nucleo/services/auth';
import { RegistroDiarioPendente } from '../../../compartilhado/models/registros-diarios.models';
import { TurmasService, TurmaResumo, EstudanteResumo } from '../../../nucleo/services/turmas.service';
import { CardAlunoComponent } from '../../../compartilhado/components/card-aluno/card-aluno';
import { AlunoModalComponent } from '../../../compartilhado/components/aluno-modal/aluno-modal.component';
import { AlunoModalData } from '../../../compartilhado/models/aluno-modal.model';
import { CalendarioService, EventoCalendario } from '../../../compartilhado/services/calendario.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  fill: ApexFill;
};

@Component({
  selector: 'app-home',
  imports: [NgApexchartsModule, CardAlunoComponent, AlunoModalComponent, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class HomeComponent implements OnInit {
  @ViewChild('chart') chart!: ChartComponent;
  public chartOptions: ChartOptions;

  private readonly registrosService = inject(RegistrosDiariosService);
  private readonly turmasService = inject(TurmasService);
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly destroyRef = inject(DestroyRef);

  private readonly calendarioService = inject(CalendarioService);

  registrosPendentes = signal<RegistroDiarioPendente[]>([]);
  totalEsperado = signal<number>(0);
  totalPreenchidos = signal<number>(0);
  loadingMetricas = signal<boolean>(true);

  turmaAtual = signal<TurmaResumo | null>(null);
  estudantes = signal<EstudanteResumo[]>([]);
  loadingEstudantes = signal(false);
  erroEstudantes = signal<string | null>(null);
  alunoEmDestaque = signal<AlunoModalData | null>(null);

  proximosEventos = signal<EventoCalendario[]>([]);
  loadingEventos = signal(false);

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
            value: { offsetY: 0, fontSize: '28px', fontWeight: '700', color: '#2D1E40' } } } },
      fill: { colors: ['#4CAF50'], type: 'solid', opacity: 1 } };

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
          opacity: 1 } };
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
        error: () => {} });

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

  // --- FUNÇÕES DO MODAL ---
  abrirModal() {
    this.isModalPendenciasAberto.set(true);
  }

  fecharModal() {
    this.isModalPendenciasAberto.set(false);
  }

  abrirDetalhesAluno(estudante: EstudanteResumo): void {
    const nomeDaTurma = this.turmaAtual()?.nome || 'Turma Indefinida';
    const diagnosticoPrincipal = estudante.diagnosticos.length > 0 
      ? estudante.diagnosticos[0]?.diagnostico?.tipo || 'Sem Laudo'
      : 'Sem Laudo';

    const dadosParaModal: AlunoModalData = {
      id: estudante.id,
      nome: estudante.nomeCompleto,
      turma: nomeDaTurma,
      diagnostico: diagnosticoPrincipal,
      nivelSuporte: 'Nível 1 de Suporte',
      foto: estudante.foto || `https://ui-avatars.com/api/?name=${estudante.nomeCompleto}&background=F0E6FF&color=4A148C`
    };

    this.alunoEmDestaque.set(dadosParaModal);
  }

  carregarProximosEventos(): void {
    const escolaId = this.authService.getEscolaId();
    if (!escolaId) return;

    this.loadingEventos.set(true);
    this.calendarioService
      .buscarProximosEventos(escolaId, 4)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (eventos) => {
          this.proximosEventos.set(eventos);
          this.loadingEventos.set(false);
        },
        error: () => this.loadingEventos.set(false)
      });
  }
}
