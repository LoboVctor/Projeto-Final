import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EstudantesService } from '../../../../../compartilhado/services/estudantes.service';

@Component({
  selector: 'app-modal-laudos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './laudos.html'
})
export class ModalLaudosComponent implements OnInit {
  @Input() estudanteId!: string;
  @Input() laudos: any[] = []; 
  
  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<void>();

  laudoForm: FormGroup;
  arquivoSelecionado: File | null = null;
  enviando = false; 

  private fb = inject(FormBuilder);
  private estudantesService = inject(EstudantesService);

  constructor() {
    this.laudoForm = this.fb.group({
      diagnostico: ['', Validators.required],
      dataEmissao: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.arquivoSelecionado = file;
    }
  }

  salvar(): void {
    if (this.laudoForm.invalid || !this.arquivoSelecionado) return;
    this.enviando = true;

    const formData = new FormData();
    formData.append('diagnostico', this.laudoForm.get('diagnostico')?.value);
    formData.append('dataEmissao', this.laudoForm.get('dataEmissao')?.value);
    formData.append('arquivo', this.arquivoSelecionado);

    this.estudantesService.uploadLaudo(this.estudanteId, formData).subscribe({
      next: () => {
        this.enviando = false;
        this.salvo.emit();
        this.emitirFechar();
      },
      error: (err) => {
        console.error('Erro ao fazer upload do laudo:', err);
        this.enviando = false;
      }
    });
  }

  emitirFechar(): void {
    this.laudoForm.reset();
    this.arquivoSelecionado = null;
    this.fechar.emit();
  }
}