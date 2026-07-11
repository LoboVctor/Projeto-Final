import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  ChangeDetectionStrategy,
  input,
  effect,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlunoModalData } from '../../models/aluno-modal.model';
import { EstudantesService } from '../../services/estudantes.service';
import { EstudanteVisaoGeral } from '../../models/estudante-visao-geral.model';
import { BlocoVisaoGeralComponent } from '../../../funcionalidades/estudante/components/bloco-visao-geral/bloco-visao-geral.component';
import { BlocoSaudeComponent } from '../../../funcionalidades/estudante/components/bloco-saude/bloco-saude.component';
import { BlocoRelatoriosComponent } from '../../../funcionalidades/estudante/components/bloco-relatorios/bloco-relatorios';
import { BlocoAgendaComponent } from '../../../funcionalidades/estudante/components/bloco-agenda/bloco-agenda.component';
import { BlocoDashboardComponent } from '../../../funcionalidades/estudante/components/bloco-dashboards/bloco-dashboard.component';
import { CadastroResponsavelComponent } from '../../../funcionalidades/estudante/cadastro-responsavel/cadastro-responsavel.component';

@Component({
  selector: 'app-aluno-modal',
  imports: [
    CommonModule,
    BlocoVisaoGeralComponent,
    BlocoSaudeComponent,
    BlocoRelatoriosComponent,
    BlocoAgendaComponent,
    BlocoDashboardComponent,
    CadastroResponsavelComponent
  ],
  templateUrl: './aluno-modal.component.html',
  styleUrls: ['./aluno-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlunoModalComponent implements OnChanges {
  private estudantesService = inject(EstudantesService);

  readonly isVisible = input<boolean>(false);
  
  // Novo input para receber a instrução de qual aba abrir (ex: 'registros')
  readonly abaInicial = input<string | null>(null); 
  
  @Input() aluno: AlunoModalData | null = null;

  @Output() fecharModal = new EventEmitter<void>();

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

  constructor() {
    // Efeito reativo: Observa quando o modal abre para focar na aba correta
    effect(() => {
      if (this.isVisible() && this.aluno) {
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
    if (changes['aluno'] && this.aluno) {
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
    this.fecharModal.emit();
  }

  toggleInfoGerais(): void {
    this.isInfoGeraisOpen.update((v) => !v);
  }

  abrirVisaoGeral(): void {
    if (!this.aluno) return;
    this.isSaudeExpanded.set(false);
    this.isRelatoriosExpanded.set(false);
    this.isAgendaExpanded.set(false);
    this.isDashboardExpanded.set(false);
    this.isResponsavelExpanded.set(false);
    this.isVisaoGeralExpanded.set(true);

    if (this.visaoGeralData()?.id === this.aluno.id) {
      return;
    }

    this.carregarVisaoGeral();
  }

  abrirSaude(): void {
    if (!this.aluno) return;
    this.isVisaoGeralExpanded.set(false);
    this.isRelatoriosExpanded.set(false);
    this.isAgendaExpanded.set(false);
    this.isDashboardExpanded.set(false);
    this.isResponsavelExpanded.set(false);
    this.isSaudeExpanded.set(true);
  }

  abrirRelatorios(): void {
    if (!this.aluno) return;
    this.isVisaoGeralExpanded.set(false);
    this.isSaudeExpanded.set(false);
    this.isAgendaExpanded.set(false);
    this.isDashboardExpanded.set(false);
    this.isResponsavelExpanded.set(false);
    this.isRelatoriosExpanded.set(true);
  }

  onDashboard(): void {
    if (!this.aluno) return;
    this.recolherPaineis();
    this.isDashboardExpanded.set(true);
  }

  abrirResponsavel(): void {
    if (!this.aluno) return;
    this.recolherPaineis();
    this.isResponsavelExpanded.set(true);
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
    if (!this.aluno) return;

    this.loadingVisaoGeral.set(true);
    this.errorVisaoGeral.set(null);

    this.estudantesService.getVisaoGeral(this.aluno.id).subscribe({
      next: (dados) => {
        this.visaoGeralData.set(dados);
        this.loadingVisaoGeral.set(false);
      },
      error: () => {
        this.errorVisaoGeral.set('Erro ao carregar a Visão Geral do estudante.');
        this.loadingVisaoGeral.set(false);
      }
    });
  }

  forceReloadVisaoGeral(): void {
    this.visaoGeralData.set(null);
    this.carregarVisaoGeral();
  }

  recolherVisaoGeral(): void {
    this.isVisaoGeralExpanded.set(false);
  }

  onAgenda(): void {
    if (!this.aluno) return;
    this.recolherPaineis();
    this.isAgendaExpanded.set(true);
  }
}