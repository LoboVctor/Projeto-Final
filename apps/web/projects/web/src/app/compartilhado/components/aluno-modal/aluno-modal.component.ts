import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
  ChangeDetectionStrategy,
  input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlunoModalData } from '../../models/aluno-modal.model';
import { EstudantesService } from '../../services/estudantes.service';
import { EstudanteVisaoGeral } from '../../models/estudante-visao-geral.model';
import { BlocoVisaoGeralComponent } from '../../../funcionalidades/estudante/components/bloco-visao-geral/bloco-visao-geral.component';
import { BlocoSaudeComponent } from '../../../funcionalidades/estudante/components/bloco-saude/bloco-saude';
import { BlocoRelatoriosComponent } from '../../../funcionalidades/estudante/components/bloco-relatorios/bloco-relatorios';
import { AgendaEstudanteComponent } from '../../../funcionalidades/estudante/components/agenda-estudante/agenda-estudante';

@Component({
  selector: 'app-aluno-modal',
  imports: [CommonModule, BlocoVisaoGeralComponent, BlocoSaudeComponent, BlocoRelatoriosComponent, AgendaEstudanteComponent],
import { BlocoAgendaComponent } from '../../../funcionalidades/estudante/components/bloco-agenda/bloco-agenda.component';

@Component({
  selector: 'app-aluno-modal',
  imports: [CommonModule, BlocoVisaoGeralComponent, BlocoSaudeComponent, BlocoRelatoriosComponent, BlocoAgendaComponent],
  templateUrl: './aluno-modal.component.html',
  styleUrls: ['./aluno-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class AlunoModalComponent {
  private estudantesService = inject(EstudantesService);

  readonly isVisible = input<boolean>(false);
  @Input() aluno: AlunoModalData | null = null;

  @Output() fecharModal = new EventEmitter<void>();
  @Output() agendaClick = new EventEmitter<void>();
  @Output() dashboardClick = new EventEmitter<void>();

  // Estados
  isInfoGeraisOpen = signal(false);
  isVisaoGeralExpanded = signal(false);
  isSaudeExpanded = signal(false);
  isRelatoriosExpanded = signal(false);
  isAgendaExpanded = signal(false);

  visaoGeralData = signal<EstudanteVisaoGeral | null>(null);
  loadingVisaoGeral = signal(false);
  errorVisaoGeral = signal<string | null>(null);

  onClose(): void {
    this.isVisaoGeralExpanded.set(false);
    this.isSaudeExpanded.set(false);
    this.isRelatoriosExpanded.set(false);
    this.isAgendaExpanded.set(false);
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
    this.isSaudeExpanded.set(true);
  }

  abrirRelatorios(): void {
    if (!this.aluno) return;
    this.isVisaoGeralExpanded.set(false);
    this.isSaudeExpanded.set(false);
    this.isAgendaExpanded.set(false);
    this.isRelatoriosExpanded.set(true);
  }

  onDashboard(): void {
    if (!this.aluno) return;
    this.recolherPaineis();
    this.isDashboardExpanded.set(true);
  }

  recolherPaineis(): void {
    this.isVisaoGeralExpanded.set(false);
    this.isSaudeExpanded.set(false);
    this.isRelatoriosExpanded.set(false);
    this.isAgendaExpanded.set(false);
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
      } });
  }

  forceReloadVisaoGeral(): void {
    this.visaoGeralData.set(null);
    this.carregarVisaoGeral();
  }

  recolherVisaoGeral(): void {
    this.isVisaoGeralExpanded.set(false);
  }

  onAgenda() {
    this.recolherPaineis();
    this.isAgendaExpanded.set(true);
  onAgenda(): void {
    if (!this.aluno) return;
    this.isVisaoGeralExpanded.set(false);
    this.isSaudeExpanded.set(false);
    this.isRelatoriosExpanded.set(false);
    this.isAgendaExpanded.set(true);
    this.agendaClick.emit();
  }


}
