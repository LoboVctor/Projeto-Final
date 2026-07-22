import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  HostListener,
  ElementRef,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { EstudantesService } from '../../../../../../compartilhado/services/estudantes.service';
import { TurmasService, TurmaResumo } from '../../../../../../nucleo/services/turmas.service';
import { EstudanteVisaoGeral } from '../../../../../../compartilhado/models/estudante-visao-geral.model';
import { CustomValidators } from '../../../../../../compartilhado/validators/custom-validators';

@Component({
  selector: 'app-modal-editar-aluno',
  imports: [ReactiveFormsModule],
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
      this.mostrarDropdownTurmas.set(false);
    }
  }

  readonly visaoGeralData = input<EstudanteVisaoGeral | null>(null);
  readonly fechar = output<void>();
  readonly salvo = output<void>();

  form!: FormGroup;
  loading = signal(false);
  erro = signal('');
  turmas = signal<TurmaResumo[]>([]);
  turmasFiltradas = signal<TurmaResumo[]>([]);
  termoBuscaTurma = signal('');
  mostrarDropdownTurmas = signal(false);
  turmaSelecionada = signal<TurmaResumo | null>(null);
  arquivoFoto: File | null = null;
  previewFoto = signal<string | ArrayBuffer | null>(null);

  ngOnInit() {
    this.initForm();
    this.carregarTurmas();
  }

  initForm() {
    const visaoGeralData = this.visaoGeralData();
    // A data de nascimento vem como string ISO no backend
    let dataNascimentoFormatada = '';
    if (visaoGeralData?.dataNascimento) {
      const d = new Date(visaoGeralData.dataNascimento);
      dataNascimentoFormatada = d.toISOString().split('T')[0] || '';
    }

    this.form = this.fb.group({
      nomeCompleto: [visaoGeralData?.nomeCompleto || '', [Validators.required, Validators.minLength(3), CustomValidators.textoInvalido()]],
      matricula: [visaoGeralData?.matricula || '', Validators.required],
      // O CPF é exibido como vem do backend (pode vir mascarado).
      // O usuário deve redigitar um CPF válido (11 dígitos) para atualizá-lo.
      // O campo fica em branco apenas se não houver CPF cadastrado.
      cpf: [visaoGeralData?.cpf || '', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      dataNascimento: [dataNascimentoFormatada, Validators.required],
      sexo: [visaoGeralData?.sexo || '', Validators.required],
      formaComunicacao: [visaoGeralData?.formaComunicacao || '', Validators.required],

      nomeResponsavel: [visaoGeralData?.responsavel?.nomeCompleto || '', [Validators.required, CustomValidators.textoInvalido()]],
      cpfResponsavel: [visaoGeralData?.responsavel?.cpf || '', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      telefoneResponsavel: [visaoGeralData?.responsavel?.telefone || '', Validators.required],
      emailResponsavel: [visaoGeralData?.responsavel?.email || '', [Validators.required, Validators.email]],
      enderecoResponsavel: [visaoGeralData?.responsavel?.endereco || '', [Validators.required, CustomValidators.textoInvalido()]],
    });

    if (visaoGeralData?.foto) {
      this.previewFoto.set(visaoGeralData.foto);
    }
  }

  apenasNumeros(event: Event, campo: string) {
    const input = event.target as HTMLInputElement;
    const numeros = input.value.replace(/\D/g, '');
    this.form.get(campo)?.setValue(numeros, { emitEvent: false });
    input.value = numeros;
  }

  carregarTurmas() {
    this.turmasService.getTurmas().subscribe({
      next: (data: TurmaResumo[]) => {
        this.turmas.set(data);
        this.turmasFiltradas.set(data);
        const nomeTurma = this.visaoGeralData()?.turma?.nome;
        if (nomeTurma) {
          const t = data.find(x => x.nome === nomeTurma);
          if (t) {
            this.selecionarTurma(t);
          }
        }
      },
      error: () => {
        this.erro.set('Não foi possível carregar as turmas.');
      }
    });
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.arquivoFoto = file;
      const reader = new FileReader();
      reader.onload = e => this.previewFoto.set(reader.result);
      reader.readAsDataURL(file);
    }
  }

  filtrarTurmas(event: Event) {
    const termo = (event.target as HTMLInputElement).value.toLowerCase();
    this.termoBuscaTurma.set(termo);
    if (!termo) {
      this.turmasFiltradas.set(this.turmas());
    } else {
      this.turmasFiltradas.set(this.turmas().filter(t =>
        t.nome.toLowerCase().includes(termo)
      ));
    }
  }

  selecionarTurma(turma: TurmaResumo) {
    this.turmaSelecionada.set(turma);
    this.mostrarDropdownTurmas.set(false);
    this.termoBuscaTurma.set(turma.nome);
  }

  limparTurma() {
    this.turmaSelecionada.set(null);
    this.termoBuscaTurma.set('');
    this.turmasFiltradas.set(this.turmas());
  }

  emitirFechar() {
    this.fechar.emit();
  }

  salvar() {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const visaoGeralData = this.visaoGeralData();
    if (!visaoGeralData?.id) {
      return;
    }

    this.loading.set(true);
    this.erro.set('');

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

    const turmaSelecionada = this.turmaSelecionada();
    if (turmaSelecionada) {
      formData.append('turmaId', turmaSelecionada.id);
    }

    if (this.arquivoFoto) {
      formData.append('arquivo', this.arquivoFoto);
    }

    this.estudantesService.atualizarEstudante(visaoGeralData.id, formData).subscribe({
      next: () => {
        this.loading.set(false);
        this.salvo.emit();
        this.emitirFechar();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.erro.set(err.error?.message || 'Erro ao editar o aluno.');
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
