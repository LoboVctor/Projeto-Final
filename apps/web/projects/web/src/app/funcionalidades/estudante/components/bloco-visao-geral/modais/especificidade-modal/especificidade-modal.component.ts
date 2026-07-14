import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstudantesService } from '../../../../../../compartilhado/services/estudantes.service';
import { EspecificidadeVisaoGeral } from '../../../../../../compartilhado/models/estudante-visao-geral.model';

@Component({
  selector: 'app-especificidade-modal',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './especificidade-modal.component.html',
  styleUrls: ['./especificidade-modal.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class EspecificidadeModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private estudantesService = inject(EstudantesService);
  private cdr = inject(ChangeDetectorRef);

  readonly estudanteId = input.required<string>();
  @Input() especificidades: EspecificidadeVisaoGeral[] = [];
  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<void>();

  especificidadeForm!: FormGroup;
  loading = false;
  erro = '';
  editingEspecificidadeId: number | null = null;

  /** Limite de caracteres dos campos */
  readonly DESCRICAO_MAX = 100;
  readonly OBSERVACAO_MAX = 500;

  private formSub?: import('rxjs').Subscription;

  ngOnInit() {
    this.initForm();
  }

  initForm(esp?: EspecificidadeVisaoGeral) {
    this.editingEspecificidadeId = esp ? esp.especificidadeId : null;
    this.especificidadeForm = this.fb.group({
      tipo: [esp?.tipo || '', Validators.required],
      categoria: [esp?.categoria || '', Validators.required],
      descricao: [esp?.descricao || '', [Validators.required, Validators.maxLength(this.DESCRICAO_MAX)]],
      observacao: [esp?.observacao || '', [Validators.maxLength(this.OBSERVACAO_MAX)]] });

    // Notifica o CD para atualizar os contadores em tempo real (OnPush)
    this.formSub?.unsubscribe();
    this.formSub = this.especificidadeForm.valueChanges.subscribe(() => this.cdr.markForCheck());
  }

  ngOnDestroy() {
    this.formSub?.unsubscribe();
  }

  /** Comprimento atual do campo descricao */
  get descricaoLength(): number {
    return this.especificidadeForm?.get('descricao')?.value?.length ?? 0;
  }

  /** Comprimento atual do campo observacao */
  get observacaoLength(): number {
    return this.especificidadeForm?.get('observacao')?.value?.length ?? 0;
  }

  getPlaceholderDescricao(): string {
    const tipo = this.especificidadeForm?.get('tipo')?.value;
    switch (tipo) {
      case 'GATILHO_CRISE':
        return 'Ex: Sons altos e inesperados';
      case 'COMPORTAMENTO_ATIPICO':
        return 'Ex: Dificuldade em manter contato visual';
      case 'RESTRICAO':
        return 'Ex: Redirecionamento para ambiente tranquilo';
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

  excluir(id: number) {
    if (!confirm('Deseja realmente excluir esta especificidade?')) return;
    this.loading = true;
    this.estudantesService.deleteEspecificidade(this.estudanteId(), id).subscribe({
      next: () => {
        this.loading = false;
        this.salvo.emit();
      },
      error: (err: any) => {
        this.loading = false;
        this.erro = 'Erro ao excluir especificidade.';
      } });
  }

  emitirFechar() {
    this.fechar.emit();
  }

  /** Verifica localmente se já existe uma especificidade com mesmo tipo+categoria (exceto a sendo editada) */
  private verificarDuplicataLocal(): boolean {
    const tipo = this.especificidadeForm.get('tipo')?.value;
    const categoria = this.especificidadeForm.get('categoria')?.value;

    return this.especificidades.some(
      (e) =>
        e.tipo === tipo &&
        e.categoria === categoria &&
        e.especificidadeId !== this.editingEspecificidadeId,
    );
  }

  salvar() {
    if (this.especificidadeForm.invalid || this.loading) return;

    // Validação local antes de ir ao servidor
    if (this.verificarDuplicataLocal()) {
      this.erro = `Já existe uma especificidade do tipo "${this.especificidadeForm.get('tipo')?.value}" com a categoria "${this.especificidadeForm.get('categoria')?.value}" para este estudante. Edite o registro existente ou escolha outra combinação.`;
      return;
    }

    this.loading = true;
    this.erro = '';
    const payload = this.especificidadeForm.value;

    const request$ = this.editingEspecificidadeId
      ? this.estudantesService.updateEspecificidade(
          this.estudanteId(),
          this.editingEspecificidadeId,
          payload,
        )
      : this.estudantesService.saveEspecificidade(this.estudanteId(), payload);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.initForm();
        this.salvo.emit();
      },
      error: (err: any) => {
        this.loading = false;
        // Trata 409 Conflict (duplicata detectada pelo backend)
        if (err?.status === 409) {
          this.erro = err?.error?.message || 'Já existe uma especificidade com a mesma categoria para este estudante.';
        } else {
          this.erro = 'Ocorreu um erro ao salvar a especificidade.';
        }
      } });
  }
}
