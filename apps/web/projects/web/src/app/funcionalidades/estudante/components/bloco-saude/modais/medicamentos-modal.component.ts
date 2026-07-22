import { Component, OnInit, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { EstudantesService } from '../../../../../compartilhado/services/estudantes.service';
import { ConfirmacaoService } from '../../../../../compartilhado/services/confirmacao.service';

function textoInvalidoValidator(): ValidatorFn {
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

export interface MedicamentoModal {
  medicamentoId?: number;
  id_medicamento?: number;
  nome?: string;
  medicamento?: { nome_medicamento: string };
  dosagem: number;
  unidadeMedida: string;
  administradoEscola?: boolean;
  administrado_na_escola?: boolean;
  intervaloAdministracao?: number | null;
  horarioAdministrado?: string | null;
}


export interface MedicamentoEstudante {
  medicamentoId: number;
  nome: string;
  dosagem: number;
  unidadeMedida: string;
}

@Component({
  selector: 'app-modal-medicamentos',
  imports: [ReactiveFormsModule, LowerCasePipe],
  templateUrl: './medicamentos-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalMedicamentosComponent implements OnInit {
  readonly estudanteId = input.required<string>();
  readonly medicamentos = input<MedicamentoModal[]>([]);

  readonly fechar = output<void>();
  readonly salvo = output<void>();

  medicamentoForm: FormGroup;
  editingMedicamentoId = signal<number | null>(null);

  private fb = inject(FormBuilder);
  private estudantesService = inject(EstudantesService);
  private confirmacaoService = inject(ConfirmacaoService);

  constructor() {
    this.medicamentoForm = this.fb.group({
      // Dados do medicamento
      nomeMedicamento: ['', [Validators.required, Validators.maxLength(80), textoInvalidoValidator()]],

      // Dados da relação do estudante com o medicamento
      dosagem: [null, [Validators.required, Validators.min(0.1)]],
      unidadeMedida: ['MG', Validators.required], // MG, ML, GOTAS, etc.
      administradoNaEscola: [false],

      intervaloAdministracao: [null],
      horarioAdministracao: ['']
    });
  }

  ngOnInit(): void {}

  selecionarParaEdicao(relacaoMedicamento: MedicamentoModal): void {
    this.editingMedicamentoId.set(relacaoMedicamento.id_medicamento || relacaoMedicamento.medicamentoId || null);

    let horarioFormatado = '';
    if (relacaoMedicamento.horarioAdministrado) {
      horarioFormatado = new Date(relacaoMedicamento.horarioAdministrado).toISOString().substring(11, 16);
    }

    this.medicamentoForm.patchValue({
      nomeMedicamento: relacaoMedicamento.medicamento?.nome_medicamento || relacaoMedicamento.nome,
      dosagem: relacaoMedicamento.dosagem,
      unidadeMedida: relacaoMedicamento.unidadeMedida,
      administradoNaEscola: relacaoMedicamento.administrado_na_escola || relacaoMedicamento.administradoEscola || false,
      intervaloAdministracao: relacaoMedicamento.intervaloAdministracao,
      horarioAdministracao: horarioFormatado
    });
  }

  cancelarEdicao(): void {
    this.editingMedicamentoId.set(null);
    this.medicamentoForm.reset({
      unidadeMedida: 'MG',
      administradoNaEscola: false
    });
  }

  salvar(): void {
    if (this.medicamentoForm.invalid) return;

    const dados = this.medicamentoForm.getRawValue();
    dados.nomeMedicamento = dados.nomeMedicamento?.trim();

    if (!dados.nomeMedicamento) return;

    const idEmEdicao = this.editingMedicamentoId();
    const acao = idEmEdicao
      ? this.estudantesService.updateMedicamento(this.estudanteId(), idEmEdicao, dados)
      : this.estudantesService.saveMedicamento(this.estudanteId(), dados);

    acao.subscribe({
      next: () => {
        this.salvo.emit();
        this.cancelarEdicao();
        this.emitirFechar();
      },
      error: (err: unknown) => console.error('Erro ao salvar medicamento:', err)
    });
  }

  async excluir(medicamentoId: number | undefined): Promise<void> {
    if (!medicamentoId) return;
    const confirmado = await this.confirmacaoService.confirmar({
      titulo: 'Excluir medicamento',
      mensagem: 'Tem certeza que deseja remover este medicamento da ficha do estudante?',
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar',
      variante: 'danger' });
    if (!confirmado) return;

    this.estudantesService.deleteMedicamento(this.estudanteId(), medicamentoId).subscribe({
      next: () => this.salvo.emit(),
      error: (err: unknown) => console.error('Erro ao excluir medicamento:', err)
    });
  }

  deveMostrarObrigatorio(control: AbstractControl | null): boolean {
    if (!control) return true;
    return control.invalid;
  }

  emitirFechar(): void {
    this.fechar.emit();
  }
}