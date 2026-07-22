import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  input,
  output,
  effect,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef
} from '@angular/core';
import { NgClass } from '@angular/common';
import { AlunoModalData } from '../../models/aluno-modal.model';
import { EstudantesService } from '../../services/estudantes.service';
import { EstudanteVisaoGeral } from '../../models/estudante-visao-geral.model';
import { BlocoVisaoGeralComponent } from '../../../funcionalidades/estudante/components/bloco-visao-geral/bloco-visao-geral.component';
import { BlocoSaudeComponent } from '../../../funcionalidades/estudante/components/bloco-saude/bloco-saude.component';
import { BlocoRelatoriosComponent } from '../../../funcionalidades/estudante/components/bloco-relatorios/bloco-relatorios';
import { BlocoAgendaComponent } from '../../../funcionalidades/estudante/components/bloco-agenda/bloco-agenda.component';
import { BlocoDashboardComponent } from '../../../funcionalidades/estudante/components/bloco-dashboards/bloco-dashboard.component';
import { API_BASE_URL } from '../../../nucleo/config/api.config';
import { DiagFullNamePipe } from '../../pipes/student.pipes';
import { DiagnosticoVisibilidadeService } from '../../services/diagnostico-visibilidade.service';

@Component({
  selector: 'app-aluno-modal',
  imports: [
    NgClass,
    BlocoVisaoGeralComponent,
    BlocoSaudeComponent,
    BlocoRelatoriosComponent,
    BlocoAgendaComponent,
    BlocoDashboardComponent,
    DiagFullNamePipe
  ],
  templateUrl: './aluno-modal.component.html',
  styleUrls: ['./aluno-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlunoModalComponent implements OnChanges {
  private estudantesService = inject(EstudantesService);
  private readonly baseUrl = inject(API_BASE_URL);
  private cdr = inject(ChangeDetectorRef);
  protected readonly diagVis = inject(DiagnosticoVisibilidadeService);

  readonly isVisible = input<boolean>(false);

  // Novo input para receber a instrução de qual aba abrir (ex: 'registros')
  readonly abaInicial = input<string | null>(null);

  readonly aluno = input<AlunoModalData | null>(null);

  readonly fecharModal = output<boolean>();

  // Estados
  isInfoGeraisOpen = signal(false);
  isVisaoGeralExpanded = signal(false);
  isSaudeExpanded = signal(false);
  isRelatoriosExpanded = signal(false);
  isAgendaExpanded = signal(false);
  isDashboardExpanded = signal(false);
  isResponsavelExpanded = signal(false);

  visaoGeralData = signal<EstudanteVisaoGeral | null>(null);
  loadingVisaoGeral = signal(false);
  errorVisaoGeral = signal<string | null>(null);
  // Tracks if any modification occurred while the modal was open
  houveModificacao = signal<boolean>(false);

  constructor() {
    // Efeito reativo: Observa quando o modal abre para focar na aba correta
    effect(() => {
      if (this.isVisible() && this.aluno()) {
        const aba = this.abaInicial();
        
        if (aba === 'registros' || aba === 'agenda') {
          this.onAgenda();
        } else if (aba === 'saude') {
          this.abrirSaude();
        } else if (aba === 'relatorios') {
          this.abrirRelatorios();
        } else if (aba === 'visao-geral') {
          this.abrirVisaoGeral();
        } else if (aba === 'dashboard') {
          this.onDashboard();
        }
      }
    }, { allowSignalWrites: true }); 
    // allowSignalWrites é necessário pois estamos alterando outros signals dentro do effect
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['aluno'] && this.aluno()) {
      this.isInfoGeraisOpen.set(true);
      this.abrirVisaoGeral();
    }
  }

  onClose(): void {
    this.isVisaoGeralExpanded.set(false);
    this.isSaudeExpanded.set(false);
    this.isRelatoriosExpanded.set(false);
    this.isAgendaExpanded.set(false);
    this.isDashboardExpanded.set(false);
    this.isResponsavelExpanded.set(false);
    this.isInfoGeraisOpen.set(false);
    this.visaoGeralData.set(null);
    this.fecharModal.emit(this.houveModificacao());
    this.houveModificacao.set(false); // Reset on close
  }

  toggleInfoGerais(): void {
    this.isInfoGeraisOpen.update((v) => !v);
  }

  abrirVisaoGeral(): void {
    const aluno = this.aluno();
    if (!aluno) return;
    this.isSaudeExpanded.set(false);
    this.isRelatoriosExpanded.set(false);
    this.isAgendaExpanded.set(false);
    this.isDashboardExpanded.set(false);
    this.isResponsavelExpanded.set(false);
    this.isVisaoGeralExpanded.set(true);

    if (this.visaoGeralData()?.id === aluno.id) {
      return;
    }

    this.carregarVisaoGeral();
  }

  abrirSaude(): void {
    if (!this.aluno()) return;
    this.isVisaoGeralExpanded.set(false);
    this.isRelatoriosExpanded.set(false);
    this.isAgendaExpanded.set(false);
    this.isDashboardExpanded.set(false);
    this.isResponsavelExpanded.set(false);
    this.isSaudeExpanded.set(true);
  }

  abrirRelatorios(): void {
    if (!this.aluno()) return;
    this.isVisaoGeralExpanded.set(false);
    this.isSaudeExpanded.set(false);
    this.isAgendaExpanded.set(false);
    this.isDashboardExpanded.set(false);
    this.isResponsavelExpanded.set(false);
    this.isRelatoriosExpanded.set(true);
  }

  onDashboard(): void {
    if (!this.aluno()) return;
    this.recolherPaineis();
    this.isDashboardExpanded.set(true);
  }

  abrirResponsavel(): void {
    if (!this.aluno()) return;
    this.recolherPaineis();
    this.isResponsavelExpanded.set(true);
  }

  getFotoUrl(aluno: AlunoModalData): string {
    if (!aluno.foto) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(aluno.nome)}&background=EDE9FE&color=4F46E5&size=64`;
    }
    if (aluno.foto.startsWith('http')) {
      return aluno.foto;
    }
    const normalizedPath = aluno.foto.replace(/\\/g, '/');
    return `${this.baseUrl}/${normalizedPath}`;
  }

  recolherPaineis(): void {
    this.isVisaoGeralExpanded.set(false);
    this.isSaudeExpanded.set(false);
    this.isRelatoriosExpanded.set(false);
    this.isAgendaExpanded.set(false);
    this.isDashboardExpanded.set(false);
    this.isResponsavelExpanded.set(false);
  }

  carregarVisaoGeral(): void {
    const aluno = this.aluno();
    if (!aluno) return;

    this.loadingVisaoGeral.set(true);
    this.errorVisaoGeral.set(null);

    this.estudantesService.getVisaoGeral(aluno.id).subscribe({
      next: (dados) => {
        this.visaoGeralData.set(dados);
        aluno.nome = dados.nomeCompleto;
        aluno.turma = dados.turma ? dados.turma.nome : 'Sem turma';
        this.loadingVisaoGeral.set(false);
      },
      error: () => {
        this.errorVisaoGeral.set('Erro ao carregar a Visão Geral do estudante.');
        this.loadingVisaoGeral.set(false);
      }
    });
  }

  formatarEtapa(etapa: string | undefined | null): string {
    if (!etapa) return 'Sem Etapa';
    
    const etapaLimpa: string = etapa.replace('_', ' ');
    return etapaLimpa.charAt(0).toUpperCase() + etapaLimpa.slice(1).toLowerCase();
  }

  getNomeTurmaLimpo(): string {
    const nomeBruto = this.visaoGeralData()?.turma?.nome || this.aluno()?.turma || '';
    const etapaBruta = this.visaoGeralData()?.turma?.etapa;
    
    const nomeBase = nomeBruto
      .replace(/\s*[-–]\s*(etapa_?\d+|etapa\s*\d+)[.\s]*$/i, '')
      .trim();

    if (!etapaBruta) {
      const match = nomeBruto.match(/[-–]\s*(etapa_?\d+|etapa\s*\d+)[.\s]*$/i);
      if (match) {
        return `${nomeBase} - ${this.formatarEtapa(match[1])}`;
      }
      return nomeBruto;
    }
    
    return `${nomeBase} - ${this.formatarEtapa(etapaBruta)}`;
  }

  forceReloadVisaoGeral(): void {
    this.visaoGeralData.set(null);
    this.houveModificacao.set(true);
    this.carregarVisaoGeral();
    const aluno = this.aluno();
    if (aluno) {
      this.estudantesService.getSaude(aluno.id).subscribe({
        next: (saude) => {
          if (saude.laudos && saude.laudos.length > 0) {
            const laudosOrdenados = [...saude.laudos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const latestDiagnostico = laudosOrdenados[0]?.diagnostico;
            aluno.diagnostico = latestDiagnostico || 'Sem diagnóstico';
          } else {
            aluno.diagnostico = 'Sem diagnóstico';
          }
          this.cdr.markForCheck();
        }
      });
    }
  }

  recolherVisaoGeral(): void {
    this.isVisaoGeralExpanded.set(false);
  }

  onAgenda(): void {
    if (!this.aluno()) return;
    this.recolherPaineis();
    this.isAgendaExpanded.set(true);
  }
}