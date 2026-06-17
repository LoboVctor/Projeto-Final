import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  inject,
  ChangeDetectionStrategy,
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
export class EspecificidadeModalComponent implements OnInit {
  private fb = inject(FormBuilder);
  private estudantesService = inject(EstudantesService);

  readonly estudanteId = input.required<string>();
  @Input() especificidades: EspecificidadeVisaoGeral[] = [];
  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<void>();

  especificidadeForm!: FormGroup;
  loading = false;
  erro = '';
  editingEspecificidadeId: number | null = null;

  ngOnInit() {
    this.initForm();
  }

  initForm(esp?: EspecificidadeVisaoGeral) {
    this.editingEspecificidadeId = esp ? esp.especificidadeId : null;
    this.especificidadeForm = this.fb.group({
      tipo: [esp?.tipo || '', Validators.required],
      categoria: [esp?.categoria || '', Validators.required],
      descricao: [esp?.descricao || '', Validators.required],
      observacao: [esp?.observacao || ''] });
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

  salvar() {
    if (this.especificidadeForm.invalid || this.loading) return;

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
        this.erro = 'Ocorreu um erro ao salvar a especificidade.';
      } });
  }
}
