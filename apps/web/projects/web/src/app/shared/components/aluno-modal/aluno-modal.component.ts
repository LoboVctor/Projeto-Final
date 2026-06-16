import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlunoModalData } from '../../models/aluno-modal.model';
import { EstudantesService } from '../../services/estudantes.service';
import { EstudanteVisaoGeral } from '../../models/estudante-visao-geral.model';
import { BlocoVisaoGeralComponent } from '../../../features/estudantes/components/bloco-visao-geral/bloco-visao-geral.component';

@Component({
  selector: 'app-aluno-modal',
  standalone: true,
  imports: [CommonModule, BlocoVisaoGeralComponent],
  templateUrl: './aluno-modal.component.html',
  styleUrls: ['./aluno-modal.component.css']
})
export class AlunoModalComponent {
  private estudantesService = inject(EstudantesService);

  @Input() isVisible: boolean = false;
  @Input() aluno: AlunoModalData | null = null;

  @Output() fecharModal = new EventEmitter<void>();
  @Output() agendaClick = new EventEmitter<void>();
  @Output() dashboardClick = new EventEmitter<void>();

  // Estados
  isInfoGeraisOpen = signal(false);
  isVisaoGeralExpanded = signal(false);
  
  visaoGeralData = signal<EstudanteVisaoGeral | null>(null);
  loadingVisaoGeral = signal(false);
  errorVisaoGeral = signal<string | null>(null);

  onClose(): void {
    this.isVisaoGeralExpanded.set(false);
    this.isInfoGeraisOpen.set(false);
    this.visaoGeralData.set(null);
    this.fecharModal.emit();
  }

  toggleInfoGerais(): void {
    this.isInfoGeraisOpen.update(v => !v);
  }

  abrirVisaoGeral(): void {
    if (!this.aluno) return;

    this.isVisaoGeralExpanded.set(true);
    
    if (this.visaoGeralData()?.id === this.aluno.id) {
      return;
    }

    this.carregarVisaoGeral();
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
    this.agendaClick.emit();
  }

  onDashboard(): void {
    this.dashboardClick.emit();
  }
}
