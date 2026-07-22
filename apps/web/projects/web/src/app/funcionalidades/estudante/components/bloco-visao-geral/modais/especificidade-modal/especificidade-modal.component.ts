import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  input,
  output,
  signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { EstudantesService } from '../../../../../../compartilhado/services/estudantes.service';
import { EspecificidadeVisaoGeral } from '../../../../../../compartilhado/models/estudante-visao-geral.model';
import { ConfirmacaoService } from '../../../../../../compartilhado/services/confirmacao.service';

export function textoInvalidoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;
    
    const normalizado = String(value).trim();
    if (!normalizado) return { soEspacos: true };
    if (/^\d+$/.test(normalizado)) return { soNumeros: true };
    if (/^-+$/.test(normalizado)) return { soHifens: true };
    
    return null;
  };
}

@Component({
  selector: 'app-especificidade-modal',
  imports: [NgClass, ReactiveFormsModule],
  templateUrl: './especificidade-modal.component.html',
  styleUrls: ['./especificidade-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class EspecificidadeModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private estudantesService = inject(EstudantesService);
  private confirmacaoService = inject(ConfirmacaoService);

  readonly estudanteId = input.required<string>();
  readonly especificidades = input<EspecificidadeVisaoGeral[]>([]);
  readonly fechar = output<void>();
  readonly salvo = output<void>();

  especificidadeForm!: FormGroup;
  loading = signal(false);
  erro = signal('');
  editingEspecificidadeId = signal<number | null>(null);

  ngOnInit() {
    this.initForm();
  }

  initForm(esp?: EspecificidadeVisaoGeral) {
    this.editingEspecificidadeId.set(esp ? esp.especificidadeId : null);
    this.especificidadeForm = this.fb.group({
      tipo: [esp?.tipo || '', Validators.required],
      categoria: [esp?.categoria || '', Validators.required],
      descricao: [esp?.descricao || '', [Validators.required, Validators.maxLength(80), textoInvalidoValidator()]],
      observacao: [esp?.observacao || '', [Validators.required, Validators.maxLength(500), textoInvalidoValidator()]] });
  }

  ngOnDestroy() {}

  getPlaceholderDescricao(): string {
    const tipo = this.especificidadeForm?.get('tipo')?.value;
    switch (tipo) {
      case 'GATILHO_CRISE':
        return 'Ex: Sons altos e inesperados';
      case 'COMPORTAMENTO_ATIPICO':
        return 'Ex: Dificuldade em manter contato visual';
      case 'CONTENCAO':
        return 'Ex: Redirecionamento para ambiente tranquilo com baixa luminosidade';
      default:
        return 'Ex: Sons altos e inesperados';
    }
  }

  cancelarEdicao() {
    this.initForm();
  }

  selecionarParaEdicao(esp: EspecificidadeVisaoGeral) {
    this.initForm(esp);
  }

  async excluir(id: number) {
    const confirmado = await this.confirmacaoService.confirmar({
      titulo: 'Excluir especificidade',
      mensagem: 'Tem certeza que deseja remover esta especificidade da ficha do estudante?',
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar',
      variante: 'danger' });
    if (!confirmado) return;

    this.loading.set(true);
    this.estudantesService.deleteEspecificidade(this.estudanteId(), id).subscribe({
      next: () => {
        this.loading.set(false);
        this.salvo.emit();
      },
      error: () => {
        this.loading.set(false);
        this.erro.set('Erro ao excluir especificidade.');
      } });
  }

  emitirFechar() {
    this.fechar.emit();
  }

  /** Verifica localmente se já existe uma especificidade com mesmo tipo+categoria (exceto a sendo editada) */
  private verificarDuplicataLocal(): boolean {
    const tipo = this.especificidadeForm.get('tipo')?.value;
    const categoria = this.especificidadeForm.get('categoria')?.value;

    return this.especificidades().some(
      (e) =>
        e.tipo === tipo &&
        e.categoria === categoria &&
        e.especificidadeId !== this.editingEspecificidadeId(),
    );
  }

  salvar() {
    if (this.especificidadeForm.invalid || this.loading()) return;

    // Validação local antes de ir ao servidor
    if (this.verificarDuplicataLocal()) {
      this.erro.set(`Já existe uma especificidade do tipo "${this.especificidadeForm.get('tipo')?.value}" com a categoria "${this.especificidadeForm.get('categoria')?.value}" para este estudante. Edite o registro existente ou escolha outra combinação.`);
      return;
    }

    this.loading.set(true);
    this.erro.set('');
    const payload = this.especificidadeForm.value;
    payload.descricao = payload.descricao?.trim();
    payload.observacao = payload.observacao?.trim();

    if (!payload.descricao || !payload.observacao) {
      this.loading.set(false);
      return;
    }

    const idEmEdicao = this.editingEspecificidadeId();
    const request$ = idEmEdicao
      ? this.estudantesService.updateEspecificidade(
          this.estudanteId(),
          idEmEdicao,
          payload,
        )
      : this.estudantesService.saveEspecificidade(this.estudanteId(), payload);

    request$.subscribe({
      next: () => {
        this.loading.set(false);
        this.initForm();
        this.salvo.emit();
      },
      error: (err: unknown) => {
        this.loading.set(false);
        // Trata 409 Conflict (duplicata detectada pelo backend)
        const httpError = err as { status?: number; error?: { message?: string } };
        if (httpError?.status === 409) {
          this.erro.set(httpError?.error?.message || 'Já existe uma especificidade com a mesma categoria para este estudante.');
        } else {
          this.erro.set('Ocorreu um erro ao salvar a especificidade.');
        }
      } });
  }

  deveMostrarObrigatorio(control: AbstractControl | null): boolean {
    if (!control) return true;
    return control.invalid;
  }
}
