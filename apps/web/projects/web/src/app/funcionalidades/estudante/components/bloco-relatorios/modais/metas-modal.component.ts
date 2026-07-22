import { Component, ChangeDetectionStrategy, inject, input, output, signal, computed } from '@angular/core';
import { NgClass } from '@angular/common';
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
import { Eixo, RelatorioSemestral, Semestre } from '../../../../../compartilhado/models/estudante-pedagogico.model';
import { ConfirmacaoService } from '../../../../../compartilhado/services/confirmacao.service';
import { FeedbackService } from '../../../../../compartilhado/services/feedback.service';

const EIXOS: Eixo[] = ['COGNITIVO', 'MOTOR', 'LINGUAGEM', 'SOCIOEMOCIONAL', 'AUTONOMIA'];

const EIXO_LABEL: Record<Eixo, string> = {
  COGNITIVO: 'Cognitivo',
  MOTOR: 'Motor',
  LINGUAGEM: 'Linguagem',
  SOCIOEMOCIONAL: 'Socioemocional',
  AUTONOMIA: 'Autonomia',
};

const naoApenasNumeros: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val: string = (control.value ?? '') as string;
  if (val.trim().length === 0) return null;
  return /^\d+$/.test(val.trim()) ? { apenasNumeros: true } : null;
};

const naoApenasEspacos: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val: string = (control.value ?? '') as string;
  if (val.length === 0) return null;
  return val.trim().length === 0 ? { apenasEspacos: true } : null;
};

const naoApenasHifens: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val: string = (control.value ?? '') as string;
  if (val.trim().length === 0) return null;
  return /^-+$/.test(val.trim()) ? { apenasHifens: true } : null;
};

@Component({
  selector: 'app-metas-modal',
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './metas-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetasModalComponent {
  readonly estudanteId = input.required<string>();
  readonly relatorios = input<RelatorioSemestral[]>([]);

  readonly fechar = output<void>();
  readonly salvou = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly estudantesService = inject(EstudantesService);
  private readonly confirmacaoService = inject(ConfirmacaoService);
  private readonly feedbackService = inject(FeedbackService);

  readonly eixos = EIXOS;
  
  eixoLabel(e: Eixo): string {
    return EIXO_LABEL[e];
  }

  enviando = signal(false);
  erro = signal<string | null>(null);

  isListagemAberta = signal(false);
  
  relatorioEmEdicao = signal<RelatorioSemestral | null>(null);

  relatoriosComMetas = computed(() => {
    const rels = this.relatorios() || [];
    return rels.filter(r => r.metas && r.metas.length > 0);
  });

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
    semestre: ['PRIMEIRO', Validators.required],
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

  deveMostrarObrigatorio(eixo: string): boolean {
    const control = this.form.get(eixo)?.get('descricao');
    return !control?.valid;
  }

  fecharModal(): void {
    this.fechar.emit();
  }

  toggleListagem(): void {
    this.isListagemAberta.update(v => !v);
  }

  editarRelatorio(relatorio: RelatorioSemestral): void {
    this.relatorioEmEdicao.set(relatorio);
    this.form.patchValue({
      ano: relatorio.ano,
      semestre: relatorio.semestre,
    });
    
    for (const eixo of EIXOS) {
      const meta = relatorio.metas.find(m => m.eixoDesenvolvimento === eixo);
      this.form.get(eixo)?.get('descricao')?.setValue(meta ? meta.descricao : '');
    }
    
    this.form.get('ano')?.disable();
    this.form.get('semestre')?.disable();
  }

  cancelarEdicao(): void {
    this.relatorioEmEdicao.set(null);
    this.form.reset({
      ano: new Date().getFullYear(),
      semestre: 'PRIMEIRO'
    });
    this.form.get('ano')?.enable();
    this.form.get('semestre')?.enable();
  }

  async excluirRelatorio(relatorio: RelatorioSemestral) {
    const confirmado = await this.confirmacaoService.confirmar({
      titulo: 'Excluir metas do semestre',
      mensagem: 'Tem certeza que deseja excluir as metas deste semestre?',
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar',
      variante: 'danger'
    });

    if (confirmado) {
      this.estudantesService.excluirMetasDoRelatorio(relatorio.id).subscribe({
        next: () => {
          this.feedbackService.showSuccess('Metas excluídas com sucesso.');
          this.salvou.emit();
        },
        error: () => {
          this.feedbackService.showError('Erro ao excluir as metas do semestre.');
        }
      });
    }
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    this.erro.set(null);

    const relatorioEdit = this.relatorioEmEdicao();
    
    if (relatorioEdit) {
      const payload = {
        metas: relatorioEdit.metas.map(meta => ({
          id: meta.id,
          descricao: (this.form.get(meta.eixoDesenvolvimento)?.get('descricao')?.value || '').trim()
        }))
      };

      this.estudantesService.atualizarMetasSemestre(relatorioEdit.id, payload).subscribe({
        next: () => {
          this.enviando.set(false);
          this.feedbackService.showSuccess('Metas do semestre atualizadas com sucesso.');
          this.salvou.emit();
          this.cancelarEdicao();
        },
        error: () => {
          this.enviando.set(false);
          this.feedbackService.showError('Erro ao atualizar as metas do semestre.');
        }
      });
      return;
    }

    const v = this.form.getRawValue();
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
        this.feedbackService.showSuccess('Metas salvas com sucesso.');
        this.salvou.emit();
        this.fechar.emit();
      },
      error: (err: unknown) => {
        this.enviando.set(false);
        const httpError = err as { status?: number; error?: { message?: string } };

        if (httpError?.status === 409) {
          this.feedbackService.showError('Este aluno já possui metas cadastradas para este semestre.');
          return;
        }

        const msg = httpError?.error?.message;
        this.feedbackService.showError(typeof msg === 'string' ? msg : 'Erro ao salvar as metas. Tente novamente.');
      },
    });
  }
}
