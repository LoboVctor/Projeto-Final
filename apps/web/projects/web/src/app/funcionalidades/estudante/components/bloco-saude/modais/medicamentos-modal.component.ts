import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EstudantesService } from '../../../../../compartilhado/services/estudantes.service';


export interface MedicamentoEstudante {
  medicamentoId: number;
  nome: string;
  dosagem: number;
  unidadeMedida: string;
}

@Component({
  selector: 'app-modal-medicamentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './medicamentos-modal.component.html'
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
    });
  }

  ngOnInit(): void {}

  selecionarParaEdicao(med: MedicamentoEstudante): void {
    this.editingMedicamentoId = med.medicamentoId;
    
    this.medicamentoForm.patchValue({
      nomeMedicamento: med.nome,
      dosagem: med.dosagem,
      unidadeMedida: med.unidadeMedida
    });
  }

  cancelarEdicao(): void {
    this.editingMedicamentoId = null;
    this.medicamentoForm.reset({ 
      unidadeMedida: 'MG' 
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
      error: (err: unknown) => console.error('Erro ao salvar medicamento:', err)
    });
  }

  excluir(medicamentoId: number): void {
    if (confirm('Tem certeza que deseja remover este medicamento da ficha do estudante?')) {
      this.estudantesService.deleteMedicamento(this.estudanteId, medicamentoId).subscribe({
        next: () => this.salvo.emit(),
        error: (err: unknown) => console.error('Erro ao excluir medicamento:', err)
      });
    }
  }

  emitirFechar(): void {
    this.fechar.emit();
  }
}