import { Component, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstudantesService, UpsertRelatorioSemestralPayload } from '../../../../../compartilhado/services/estudantes.service';
import { Eixo, Semestre } from '../../../../../compartilhado/models/estudante-pedagogico.model';

const EIXOS: Eixo[] = ['COGNITIVO', 'MOTOR', 'LINGUAGEM', 'SOCIOEMOCIONAL', 'AUTONOMIA'];

const EIXO_LABEL: Record<Eixo, string> = {
  COGNITIVO: 'Cognitivo',
  MOTOR: 'Motor',
  LINGUAGEM: 'Linguagem',
  SOCIOEMOCIONAL: 'Socioemocional',
  AUTONOMIA: 'Autonomia',
};

@Component({
  selector: 'app-metas-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './metas-modal.component.html',
})
export class MetasModalComponent {
  readonly estudanteId = input.required<string>();

  @Output() fechar = new EventEmitter<void>();
  @Output() salvou = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly estudantesService = inject(EstudantesService);

  readonly eixos = EIXOS;
  readonly eixoLabel = (e: Eixo) => EIXO_LABEL[e];

  enviando = signal(false);
  erro = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    ano: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    semestre: ['PRIMEIRO' as Semestre, Validators.required],
    // Sub-grupos para cada eixo
    COGNITIVO: this.fb.group({ descricao: ['', Validators.required] }),
    MOTOR: this.fb.group({ descricao: ['', Validators.required] }),
    LINGUAGEM: this.fb.group({ descricao: ['', Validators.required] }),
    SOCIOEMOCIONAL: this.fb.group({ descricao: ['', Validators.required] }),
    AUTONOMIA: this.fb.group({ descricao: ['', Validators.required] }),
  });

  eixoChipClass(e: Eixo): string {
    const map: Record<Eixo, string> = {
      COGNITIVO: 'bg-blue-50 text-blue-700',
      MOTOR: 'bg-orange-50 text-orange-700',
      LINGUAGEM: 'bg-purple-50 text-purple-700',
      SOCIOEMOCIONAL: 'bg-pink-50 text-pink-700',
      AUTONOMIA: 'bg-teal-50 text-teal-700',
    };
    return map[e] ?? 'bg-gray-50 text-gray-700';
  }

  fecharModal(): void {
    this.fechar.emit();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erro.set(null);

    const v = this.form.value;
    const payload: UpsertRelatorioSemestralPayload = {
      estudanteId: this.estudanteId(),
      semestre: v.semestre as Semestre,
      ano: Number(v.ano),
      metas: EIXOS.map(eixo => ({
        eixoDesenvolvimento: eixo,
        descricao: v[eixo].descricao as string,
        scoreFinal: 0,
        parecer: '',
      })),
    };

    this.estudantesService.upsertRelatorioSemestral(payload).subscribe({
      next: () => {
        this.enviando.set(false);
        this.salvou.emit();
        this.fechar.emit();
      },
      error: (err: unknown) => {
        this.enviando.set(false);
        const msg = (err as { error?: { message?: string } })?.error?.message;
        this.erro.set(typeof msg === 'string' ? msg : 'Erro ao salvar as metas. Tente novamente.');
      },
    });
  }
}
