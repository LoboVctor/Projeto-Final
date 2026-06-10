import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlunoModalData } from '../../models/aluno-modal.model';

@Component({
  selector: 'app-aluno-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aluno-modal.component.html',
  styleUrls: ['./aluno-modal.component.css']
})
export class AlunoModalComponent {
  @Input() isVisible: boolean = false;
  @Input() aluno: AlunoModalData | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() informacoesGeraisClick = new EventEmitter<void>();
  @Output() agendaClick = new EventEmitter<void>();
  @Output() dashboardClick = new EventEmitter<void>();

  onClose(): void {
    this.closeModal.emit();
  }

  onInformacoesGerais(): void {
    this.informacoesGeraisClick.emit();
  }

  onAgenda(): void {
    this.agendaClick.emit();
  }

  onDashboard(): void {
    this.dashboardClick.emit();
  }
}
