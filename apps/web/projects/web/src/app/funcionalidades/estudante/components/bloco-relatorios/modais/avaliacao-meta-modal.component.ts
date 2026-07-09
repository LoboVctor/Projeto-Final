import { Component, EventEmitter, Output, inject, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MetaDesenvolvimento } from '../../../../../compartilhado/models/estudante-pedagogico.model';
import { EstudantesService } from '../../../../../compartilhado/services/estudantes.service';

@Component({
  selector: 'app-avaliacao-meta-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './avaliacao-meta-modal.component.html'
})
export class AvaliacaoMetaModalComponent implements OnInit {
  readonly meta = input.required<MetaDesenvolvimento>();
  
  @Output() fechar = new EventEmitter<void>();
  @Output() salvou = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly estudantesService = inject(EstudantesService);

  form!: FormGroup;
  isLoading = false;

  ngOnInit(): void {
    const metaAtual = this.meta();
    this.form = this.fb.group({
      scoreFinal: [metaAtual.scoreFinal ?? 0, [Validators.required, Validators.min(0), Validators.max(5)]],
      parecer: [metaAtual.parecer || '', Validators.maxLength(1000)]
    });
  }

  get scoreFinalValue(): number {
    return this.form.get('scoreFinal')?.value || 0;
  }

  scoreFinalLabel(score: number): string {
    if (score === 5) return 'Alcançado';
    if (score >= 3) return 'Parcialmente alcançado';
    if (score >= 1) return 'Não alcançado';
    return 'Pendente';
  }

  scoreFinalBadgeClass(score: number): string {
    if (score === 5) return 'bg-green-50 text-green-700 border border-green-200';
    if (score >= 3) return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (score >= 1) return 'bg-red-50 text-red-700 border border-red-200';
    return 'bg-gray-100 text-gray-500 border border-gray-200';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const payload = this.form.value;

    this.estudantesService.updateAvaliacaoMeta(this.meta().id, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.salvou.emit();
        this.fechar.emit();
      },
      error: () => {
        this.isLoading = false;
        // Ideally show toast error
        console.error('Erro ao atualizar meta');
      }
    });
  }
}
