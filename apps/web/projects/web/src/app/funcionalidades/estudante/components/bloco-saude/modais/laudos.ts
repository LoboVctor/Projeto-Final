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
  editandoId: string | null = null;
  arquivoAtualNome: string | null = null;

  private fb = inject(FormBuilder);
  private estudantesService = inject(EstudantesService);

  constructor() {
    this.laudoForm = this.fb.group({
      tipoDiagnostico: ['TEA', Validators.required], 
      tipoDocumento: ['LAUDO_MEDICO', Validators.required],
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
    if (this.laudoForm.invalid || (!this.editandoId && !this.arquivoSelecionado)) return;
    this.enviando = true;

    const formData = new FormData();
    formData.append('tipoDiagnostico', this.laudoForm.get('tipoDiagnostico')?.value);
    formData.append('tipoDocumento', this.laudoForm.get('tipoDocumento')?.value);
    formData.append('dataEmissao', this.laudoForm.get('dataEmissao')?.value);
    
    if (this.arquivoSelecionado) {
      formData.append('arquivo', this.arquivoSelecionado);
    }

    if (this.editandoId) {
      this.estudantesService.atualizarLaudo(this.estudanteId, this.editandoId, formData).subscribe({
        next: () => this.finalizarAcao(),
        error: (err) => this.tratarErro(err)
      });
    } else {
      this.estudantesService.uploadLaudo(this.estudanteId, formData).subscribe({
        next: () => this.finalizarAcao(),
        error: (err) => this.tratarErro(err)
      });
    }
  }

  editar(laudo: any): void {
    this.editandoId = laudo.id; 
    this.arquivoSelecionado = null; 

    if (laudo.urlArquivo) {
      this.arquivoAtualNome = laudo.urlArquivo.split('/').pop() || 'Arquivo anexado';
    } else {
      this.arquivoAtualNome = null;
    }

    const dataFormatada = laudo.dataEmissao ? new Date(laudo.dataEmissao).toISOString().split('T')[0] : '';

    const mapaDiagnostico: { [key: string]: string } = {
      'Transtorno do Espectro Autista': 'TEA',
      'TEA (Autismo)': 'TEA',
      'TEA': 'TEA',
      'TDAH': 'TDAH',
      'Síndrome de Down': 'SINDROME_DOWN',
      'Paralisia Cerebral': 'PARALISIA_CEREBRAL',
      'Deficiência Intelectual': 'DEFICIENCIA_INTELECTUAL',
      'Deficiência Múltipla': 'DEFICIENCIA_MULTIPLA',
    };

    const valorSelectDiagnostico = mapaDiagnostico[laudo.diagnostico] || laudo.diagnostico || 'OUTRO';
    
    this.laudoForm.patchValue({
      tipoDiagnostico: valorSelectDiagnostico, 
      tipoDocumento: laudo.tipo,
      dataEmissao: dataFormatada
    });
  }

  excluir(laudoId: string): void {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      this.estudantesService.excluirLaudo(this.estudanteId, laudoId).subscribe({
        next: () => {
          this.salvo.emit(); 
        },
        error: (err) => console.error('Erro ao excluir', err)
      });
    }
  }

  finalizarAcao(): void {
    this.enviando = false;
    this.salvo.emit();
    this.emitirFechar();
  }

  tratarErro(err: any): void {
    console.error('Erro na requisição:', err);
    this.enviando = false;
  }

  emitirFechar(): void {
    this.laudoForm.reset();
    this.arquivoSelecionado = null;
    this.editandoId = null;
    this.arquivoAtualNome = null;
    this.fechar.emit();
  }
}