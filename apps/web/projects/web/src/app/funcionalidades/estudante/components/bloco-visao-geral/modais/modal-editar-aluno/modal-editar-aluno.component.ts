import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EstudantesService } from '../../../../../../compartilhado/services/estudantes.service';
import { TurmasService, TurmaResumo } from '../../../../../../nucleo/services/turmas.service';
import { EstudanteVisaoGeral } from '../../../../../../compartilhado/models/estudante-visao-geral.model';
import { CustomValidators } from '../../../../../../compartilhado/validators/custom-validators';

@Component({
  selector: 'app-modal-editar-aluno',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modal-editar-aluno.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalEditarAlunoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private estudantesService = inject(EstudantesService);
  private turmasService = inject(TurmasService);
  private el = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.mostrarDropdownTurmas = false;
    }
  }

  @Input() visaoGeralData: EstudanteVisaoGeral | null = null;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  erro = '';
  turmas: TurmaResumo[] = [];
  turmasFiltradas: TurmaResumo[] = [];
  termoBuscaTurma = '';
  mostrarDropdownTurmas = false;
  turmaSelecionada: TurmaResumo | null = null;
  arquivoFoto: File | null = null;
  previewFoto: string | ArrayBuffer | null = null;

  ngOnInit() {
    this.initForm();
    this.carregarTurmas();
  }

  initForm() {
    // A data de nascimento vem como string ISO no backend
    let dataNascimentoFormatada = '';
    if (this.visaoGeralData?.dataNascimento) {
      const d = new Date(this.visaoGeralData.dataNascimento);
      dataNascimentoFormatada = d.toISOString().split('T')[0] || '';
    }

    this.form = this.fb.group({
      nomeCompleto: [this.visaoGeralData?.nomeCompleto || '', [Validators.required, Validators.minLength(3), CustomValidators.textoInvalido()]],
      matricula: [this.visaoGeralData?.matricula || '', Validators.required],
      // O CPF é exibido como vem do backend (pode vir mascarado).
      // O usuário deve redigitar um CPF válido (11 dígitos) para atualizá-lo.
      // O campo fica em branco apenas se não houver CPF cadastrado.
      cpf: [this.visaoGeralData?.cpf || '', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      dataNascimento: [dataNascimentoFormatada, Validators.required],
      sexo: [this.visaoGeralData?.sexo || '', Validators.required],
      formaComunicacao: [this.visaoGeralData?.formaComunicacao || '', Validators.required],

      nomeResponsavel: [this.visaoGeralData?.responsavel?.nomeCompleto || '', [Validators.required, CustomValidators.textoInvalido()]],
      cpfResponsavel: [this.visaoGeralData?.responsavel?.cpf || '', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      telefoneResponsavel: [this.visaoGeralData?.responsavel?.telefone || '', Validators.required],
      emailResponsavel: [this.visaoGeralData?.responsavel?.email || '', [Validators.required, Validators.email]],
      enderecoResponsavel: [this.visaoGeralData?.responsavel?.endereco || '', [Validators.required, CustomValidators.textoInvalido()]],
    });

    if (this.visaoGeralData?.foto) {
      this.previewFoto = this.visaoGeralData.foto;
    }
  }

  apenasNumeros(event: any, campo: string) {
    const inputValue = event.target.value;
    const numeros = inputValue.replace(/\D/g, '');
    this.form.get(campo)?.setValue(numeros, { emitEvent: false });
    event.target.value = numeros;
  }

  carregarTurmas() {
    this.turmasService.getTurmas().subscribe({
      next: (data: TurmaResumo[]) => {
        this.turmas = data;
        this.turmasFiltradas = data;
        if (this.visaoGeralData?.turma?.nome) {
          const t = this.turmas.find(x => x.nome === this.visaoGeralData!.turma!.nome);
          if (t) {
            this.selecionarTurma(t);
          }
        }
      },
      error: () => {
        this.erro = 'Não foi possível carregar as turmas.';
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.arquivoFoto = file;
      const reader = new FileReader();
      reader.onload = e => this.previewFoto = reader.result;
      reader.readAsDataURL(file);
    }
  }

  filtrarTurmas(event: any) {
    const termo = event.target.value.toLowerCase();
    this.termoBuscaTurma = termo;
    if (!termo) {
      this.turmasFiltradas = this.turmas;
    } else {
      this.turmasFiltradas = this.turmas.filter(t => 
        t.nome.toLowerCase().includes(termo)
      );
    }
  }

  selecionarTurma(turma: TurmaResumo) {
    this.turmaSelecionada = turma;
    this.mostrarDropdownTurmas = false;
    this.termoBuscaTurma = turma.nome;
  }

  limparTurma() {
    this.turmaSelecionada = null;
    this.termoBuscaTurma = '';
    this.turmasFiltradas = this.turmas;
  }

  emitirFechar() {
    this.fechar.emit();
  }

  salvar() {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }
    
    if (!this.visaoGeralData?.id) {
      return;
    }

    this.loading = true;
    this.erro = '';
    
    const formData = new FormData();
    // Aplica trim() nos campos de texto antes do envio (padrão da aba Saúde)
    const valores = { ...this.form.value } as Record<string, string | null | undefined>;
    const camposTexto: string[] = ['nomeCompleto', 'nomeResponsavel', 'enderecoResponsavel'];
    camposTexto.forEach(campo => {
      if (valores[campo]) valores[campo] = (valores[campo] as string).trim();
    });

    Object.keys(valores).forEach(key => {
      // CPF: só envia se tiver 11 dígitos limpos (evita enviar valor mascarado do backend)
      if (key === 'cpf') {
        const cpfLimpo = String(valores[key] || '').replace(/\D/g, '');
        if (cpfLimpo.length === 11) {
          formData.append(key, cpfLimpo);
        }
        return;
      }
      const valor = valores[key];
      if (valor != null) {
        formData.append(key, valor);
      }
    });

    if (this.turmaSelecionada) {
      formData.append('turmaId', this.turmaSelecionada.id);
    }
    
    if (this.arquivoFoto) {
      formData.append('arquivo', this.arquivoFoto);
    }

    this.estudantesService.atualizarEstudante(this.visaoGeralData.id, formData).subscribe({
      next: () => {
        this.loading = false;
        this.salvo.emit();
        this.emitirFechar();
      },
      error: (err: any) => {
        this.loading = false;
        this.erro = err?.error?.message || 'Erro ao editar o aluno.';
      }
    });
  }

  /** Controla o asterisco (*) no label: exibe quando o campo está sem valor (vazio). */
  deveMostrarObrigatorio(controlName: string): boolean {
    const control = this.form.get(controlName);
    if (!control) return false;
    const value = control.value;
    return value === null || value === undefined || String(value).trim() === '';
  }

  /** Controla bordas vermelhas e mensagens: apenas após o campo ter sido tocado. */
  isCampoInvalido(controlName: string): boolean {
    const control = this.form.get(controlName);
    return (control?.invalid && control?.touched) ?? false;
  }
}
