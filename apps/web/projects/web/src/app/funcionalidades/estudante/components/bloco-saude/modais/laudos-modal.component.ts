import { Component, EventEmitter, OnInit, inject, input, Output, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { EstudantesService } from '../../../../../compartilhado/services/estudantes.service';
import { ConfirmacaoService } from '../../../../../compartilhado/services/confirmacao.service';

/** Interface forte para o contrato de Laudos e remoção do uso de any */
export interface LaudoEstudante {
  id: string;
  diagnostico: string;
  tipo: string;
  urlArquivo: string;
  dataEmissao: string;
  createdAt: string;
}

@Component({
  selector: 'app-modal-laudos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './laudos-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalLaudosComponent implements OnInit {
  // Utilizando o padrão de Signals modernos do Angular 21 para Inputs
  readonly estudanteId = input.required<string>();
  readonly laudos = input<LaudoEstudante[]>([]); 
  
  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<void>();

  laudoForm: FormGroup;
  arquivoSelecionado: File | null = null;
  
  // Controle de estados locais em Signals reativos
  readonly enviando = signal<boolean>(false);
  readonly editandoId = signal<string | null>(null);
  readonly arquivoAtualNome = signal<string | null>(null);
  readonly erroCliente = signal<string | null>(null);

  private fb = inject(FormBuilder);
  private estudantesService = inject(EstudantesService);
  private confirmacaoService = inject(ConfirmacaoService);

  constructor() {
    this.laudoForm = this.fb.group({
      tipoDiagnostico: ['TEA', Validators.required], 
      tipoDocumento: ['LAUDO_MEDICO', Validators.required],
      dataEmissao: ['', Validators.required],
    });
  }

  ngOnInit(): void {}

  /**
   * Captura a mudança de arquivos e valida localmente extensão e tamanho.
   * Regra de Negócio: Limite máximo de 5MB e formatos PDF, JPG, JPEG e PNG.
   */
  onFileChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.erroCliente.set(null);

    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];
      if (!file) {
        this.arquivoSelecionado = null;
        inputElement.value = '';
        return;
      }
      const tamanhoMaximoBytes = 5 * 1024 * 1024; // 5MB
      const extensoesPermitidas = /(\.pdf|\.jpg|\.jpeg|\.png)$/i;

      // Validação 1: Extensão / Tipo MIME
      if (!extensoesPermitidas.test(file.name)) {
        this.erroCliente.set('Formato inválido. Selecione apenas arquivos PDF, JPG, JPEG ou PNG.');
        this.arquivoSelecionado = null;
        inputElement.value = '';
        return;
      }

      // Validação 2: Tamanho máximo do arquivo
      if (file.size > tamanhoMaximoBytes) {
        this.erroCliente.set('O arquivo excede o limite máximo permitido de 5MB.');
        this.arquivoSelecionado = null;
        inputElement.value = '';
        return;
      }

      this.arquivoSelecionado = file;
    }
  }

  salvar(): void {
    if (this.laudoForm.invalid || (!this.editandoId() && !this.arquivoSelecionado)) return;
    this.enviando.set(true);

    const formData = new FormData();
    formData.append('tipoDiagnostico', this.laudoForm.get('tipoDiagnostico')?.value);
    formData.append('tipoDocumento', this.laudoForm.get('tipoDocumento')?.value);
    formData.append('dataEmissao', this.laudoForm.get('dataEmissao')?.value);
    
    if (this.arquivoSelecionado) {
      formData.append('arquivo', this.arquivoSelecionado);
    }

    if (this.editandoId()) {
      this.estudantesService.atualizarLaudo(this.estudanteId(), this.editandoId()!, formData).subscribe({
        next: () => this.finalizarAcao(),
        error: (err: unknown) => this.tratarErro(err)
      });
    } else {
      this.estudantesService.uploadLaudo(this.estudanteId(), formData).subscribe({
        next: () => this.finalizarAcao(),
        error: (err: unknown) => this.tratarErro(err)
      });
    }
  }

  editar(laudo: LaudoEstudante): void {
    this.editandoId.set(laudo.id); 
    this.arquivoSelecionado = null; 
    this.erroCliente.set(null);

    if (laudo.urlArquivo) {
      this.arquivoAtualNome.set(laudo.urlArquivo.split('/').pop() || 'Arquivo anexado');
    } else {
      this.arquivoAtualNome.set(null);
    }

    const dataFormatada = laudo.dataEmissao ? new Date(laudo.dataEmissao).toISOString().split('T')[0] : '';

    const mapaDiagnostico: Record<string, string> = {
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

  async excluir(laudoId: string): Promise<void> {
    const confirmado = await this.confirmacaoService.confirmar({
      titulo: 'Excluir laudo',
      mensagem: 'Tem certeza que deseja remover este laudo ou diagnóstico da ficha do estudante?',
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar',
      variante: 'danger' });
    if (!confirmado) return;

    this.estudantesService.excluirLaudo(this.estudanteId(), laudoId).subscribe({
      next: () => {
        this.salvo.emit(); 
      },
      error: (err: unknown) => console.error('Erro ao excluir', err)
    });
  }

  cancelarEdicao(): void {
    this.editandoId.set(null);
    this.arquivoSelecionado = null;
    this.arquivoAtualNome.set(null);
    this.laudoForm.reset({
      tipoDiagnostico: 'TEA',
      tipoDocumento: 'LAUDO_MEDICO',
      dataEmissao: ''
    });
  }

  finalizarAcao(): void {
    this.enviando.set(false);
    this.salvo.emit();
    this.emitirFechar();
  }

  tratarErro(err: unknown): void {
    console.error('Erro na requisição:', err);
    this.enviando.set(false);
  }

  deveMostrarObrigatorio(control: AbstractControl | null): boolean {
    if (!control) return true;
    return control.invalid;
  }

  emitirFechar(): void {
    this.laudoForm.reset();
    this.arquivoSelecionado = null;
    this.editandoId.set(null);
    this.arquivoAtualNome.set(null);
    this.erroCliente.set(null);
    this.fechar.emit();
  }
}