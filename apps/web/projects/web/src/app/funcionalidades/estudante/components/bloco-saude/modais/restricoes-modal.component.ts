import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { EstudantesService } from '../../../../../compartilhado/services/estudantes.service';
import { ConfirmacaoService } from '../../../../../compartilhado/services/confirmacao.service';

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
  selector: 'app-modal-especificidades',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './restricoes-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush })
export class ModalEspecificidadesComponent implements OnInit {
  readonly estudanteId = input.required<string>();
  @Input() especificidades: any[] = [];

  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<void>();

  especificidadeForm: FormGroup;
  editingEspecificidadeId: number | null = null;

  private fb = inject(FormBuilder);
  private estudantesService = inject(EstudantesService);
  private confirmacaoService = inject(ConfirmacaoService);

  constructor() {
    this.especificidadeForm = this.fb.group({
      tipo: [{ value: 'RESTRICAO', disabled: true }, Validators.required],
      categoria: ['ALIMENTAR', Validators.required],
      descricao: ['', [Validators.required, Validators.maxLength(80), textoInvalidoValidator()]],
      observacao: ['', [Validators.required, Validators.maxLength(500), textoInvalidoValidator()]] });
  }

  ngOnInit(): void {}

  selecionarParaEdicao(especificidade: any): void {
    this.editingEspecificidadeId = especificidade.especificidadeId;
    this.especificidadeForm.patchValue(especificidade);
  }

  cancelarEdicao(): void {
    this.editingEspecificidadeId = null;
    this.especificidadeForm.reset({ tipo: 'RESTRICAO', categoria: 'ALIMENTAR' });
  }

  salvar(): void {
    if (this.especificidadeForm.invalid) return;

    const dados = this.especificidadeForm.getRawValue();
    dados.descricao = dados.descricao?.trim();
    dados.observacao = dados.observacao?.trim();
    
    if (!dados.descricao || !dados.observacao) return;

    const acao = this.editingEspecificidadeId
      ? this.estudantesService.updateEspecificidade(
          this.estudanteId(),
          this.editingEspecificidadeId,
          dados,
        )
      : this.estudantesService.saveEspecificidade(this.estudanteId(), dados);

    acao.subscribe({
      next: () => {
        this.salvo.emit();
        this.cancelarEdicao();
      },
      error: (err) => console.error('Erro ao salvar:', err) });
  }

  async excluir(especificidadeId: number): Promise<void> {
    const confirmado = await this.confirmacaoService.confirmar({
      titulo: 'Excluir restrição',
      mensagem: 'Tem certeza que deseja remover esta restrição ou alerta da ficha do estudante?',
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar',
      variante: 'danger' });
    if (!confirmado) return;

    this.estudantesService.deleteEspecificidade(this.estudanteId(), especificidadeId).subscribe({
      next: () => this.salvo.emit(),
      error: (err) => console.error('Erro ao excluir:', err) });
  }

  emitirFechar(): void {
    this.fechar.emit();
  }

  deveMostrarObrigatorio(control: AbstractControl | null): boolean {
    if (!control) return true;
    return control.invalid;
  }
}
