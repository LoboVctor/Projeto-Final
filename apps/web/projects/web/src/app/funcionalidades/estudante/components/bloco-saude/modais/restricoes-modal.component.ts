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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EstudantesService } from '../../../../../compartilhado/services/estudantes.service';

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

  constructor() {
    this.especificidadeForm = this.fb.group({
      tipo: [{ value: 'RESTRICAO', disabled: true }, Validators.required],
      categoria: ['ALIMENTAR', Validators.required],
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      observacao: ['', Validators.required] });
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

  excluir(especificidadeId: number): void {
    if (confirm('Tem certeza que deseja remover esta especificidade?')) {
      this.estudantesService.deleteEspecificidade(this.estudanteId(), especificidadeId).subscribe({
        next: () => this.salvo.emit(),
        error: (err) => console.error('Erro ao excluir:', err) });
    }
  }

  emitirFechar(): void {
    this.fechar.emit();
  }
}
