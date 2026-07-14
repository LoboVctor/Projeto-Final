import { Component, EventEmitter, inject, input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
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

/** Validador customizado: rejeita strings compostas apenas por dígitos */
const naoApenasNumeros: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val: string = (control.value ?? '') as string;
  if (val.trim().length === 0) return null; // deixa o 'required' tratar o campo vazio
  return /^\d+$/.test(val.trim()) ? { apenasNumeros: true } : null;
};

/** Validador customizado: rejeita strings compostas apenas por espaços em branco */
const naoApenasEspacos: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val: string = (control.value ?? '') as string;
  if (val.length === 0) return null; // deixa o 'required' tratar o campo vazio
  return val.trim().length === 0 ? { apenasEspacos: true } : null;
};

/** Validador customizado: rejeita strings compostas apenas por hífens */
const naoApenasHifens: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val: string = (control.value ?? '') as string;
  if (val.trim().length === 0) return null; // deixa o 'required' tratar o campo vazio
  return /^-+$/.test(val.trim()) ? { apenasHifens: true } : null;
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

  /** Validadores aplicados ao campo descrição de cada eixo */
  private readonly descricaoValidators = [
    Validators.required,
    Validators.minLength(10),
    Validators.maxLength(80),
    naoApenasNumeros,
    naoApenasEspacos,
    naoApenasHifens,
  ];

  form: FormGroup = this.fb.group({
    ano: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    semestre: ['PRIMEIRO' as Semestre, Validators.required],
    // Sub-grupos para cada eixo com validações completas
    COGNITIVO: this.fb.group({ descricao: ['', this.descricaoValidators] }),
    MOTOR: this.fb.group({ descricao: ['', this.descricaoValidators] }),
    LINGUAGEM: this.fb.group({ descricao: ['', this.descricaoValidators] }),
    SOCIOEMOCIONAL: this.fb.group({ descricao: ['', this.descricaoValidators] }),
    AUTONOMIA: this.fb.group({ descricao: ['', this.descricaoValidators] }),
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
        descricao: (v[eixo].descricao as string || '').trim(),
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
        const httpError = err as { status?: number; error?: { message?: string } };

        // Trata o erro 409 (duplicidade) com mensagem específica — sem fechar o modal
        if (httpError?.status === 409) {
          this.erro.set(
            'Este aluno já possui metas cadastradas para este semestre. A criação de novas metas não é permitida para evitar substituição dos registros existentes.',
          );
          return;
        }

        const msg = httpError?.error?.message;
        this.erro.set(typeof msg === 'string' ? msg : 'Erro ao salvar as metas. Tente novamente.');
      },
    });
  }
}
