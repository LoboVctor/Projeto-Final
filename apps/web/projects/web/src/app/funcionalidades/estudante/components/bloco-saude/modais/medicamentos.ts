import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EstudantesService } from '../../../../../compartilhado/services/estudantes.service';

@Component({
  selector: 'app-modal-medicamentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medicamentos.html'
})
export class ModalMedicamentosComponent implements OnInit {
  @Input() estudanteId!: string;
  @Input() medicamentos: any[] = []; 
  
  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<void>();

  medicamentoForm: FormGroup;
  editingMedicamentoId: number | null = null; 

  private fb = inject(FormBuilder);
  private estudantesService = inject(EstudantesService);

  constructor() {
    this.medicamentoForm = this.fb.group({
      // Dados do medicamento
      nomeMedicamento: ['', [Validators.required, Validators.minLength(2)]],
      
      // Dados da relação do estudante com o medicamento
      dosagem: [null, [Validators.required, Validators.min(0.1)]],
      unidadeMedida: ['MG', Validators.required], // MG, ML, GOTAS, etc.
      administradoNaEscola: [false],
      
      intervaloAdministracao: [null], 
      horarioAdministracao: ['']
    });
  }

  ngOnInit(): void {}

  selecionarParaEdicao(relacaoMedicamento: any): void {
    this.editingMedicamentoId = relacaoMedicamento.id_medicamento;

    let horarioFormatado = '';
    if (relacaoMedicamento.horarioAdministrado) {
      horarioFormatado = new Date(relacaoMedicamento.horarioAdministrado).toISOString().substring(11, 16);
    }
    
    this.medicamentoForm.patchValue({
      nomeMedicamento: relacaoMedicamento.medicamento?.nome_medicamento,
      dosagem: relacaoMedicamento.dosagem,
      unidadeMedida: relacaoMedicamento.unidadeMedida,
      administradoNaEscola: relacaoMedicamento.administrado_na_escola,
      intervaloAdministracao: relacaoMedicamento.intervaloAdministracao,
      horarioAdministracao: horarioFormatado
    });
  }

  cancelarEdicao(): void {
    this.editingMedicamentoId = null;
    this.medicamentoForm.reset({ 
      unidadeMedida: 'MG', 
      administradoNaEscola: false 
    });
  }

  salvar(): void {
    if (this.medicamentoForm.invalid) return;

    const dados = this.medicamentoForm.getRawValue();
    
    const acao = this.editingMedicamentoId 
      ? this.estudantesService.updateMedicamento(this.estudanteId, this.editingMedicamentoId, dados)
      : this.estudantesService.saveMedicamento(this.estudanteId, dados);

    acao.subscribe({
      next: () => {
        this.salvo.emit();
        this.cancelarEdicao();
        this.emitirFechar();
      },
      error: (err) => console.error('Erro ao salvar medicamento:', err)
    });
  }

  excluir(medicamentoId: number): void {
    if (confirm('Tem certeza que deseja remover este medicamento da ficha do estudante?')) {
      this.estudantesService.deleteMedicamento(this.estudanteId, medicamentoId).subscribe({
        next: () => this.salvo.emit(),
        error: (err) => console.error('Erro ao excluir medicamento:', err)
      });
    }
  }

  emitirFechar(): void {
    this.fechar.emit();
  }
}