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
import { EstudantesService } from '../../../../../compartilhado/services/estudantes.service';
import { TurmasService, TurmaResumo } from '../../../../../nucleo/services/turmas.service';
import { CustomValidators } from '../../../../../compartilhado/validators/custom-validators';

@Component({
  selector: 'app-modal-cadastrar-aluno',
  imports: [ReactiveFormsModule],
  templateUrl: './modal-cadastrar-aluno.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalCadastrarAlunoComponent implements OnInit {
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

  readonly isOpen = input(false);
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
    this.form = this.fb.group({
      nomeCompleto: ['', [Validators.required, Validators.minLength(3), CustomValidators.textoInvalido()]],
      matricula: ['', Validators.required],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      dataNascimento: ['', Validators.required],
      sexo: ['', Validators.required],
      formaComunicacao: ['', Validators.required],
    });
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

    this.loading.set(true);
    this.erro.set('');

    // Aplica trim() nos campos de texto antes do envio (padrão da aba Saúde)
    const valores = { ...this.form.value };
    if (valores['nomeCompleto']) valores['nomeCompleto'] = valores['nomeCompleto'].trim();

    const formData = new FormData();
    Object.keys(valores).forEach(key => {
      formData.append(key, valores[key]);
    });

    const turmaSelecionada = this.turmaSelecionada();
    if (turmaSelecionada) {
      formData.append('turmaId', turmaSelecionada.id);
    }

    if (this.arquivoFoto) {
      formData.append('arquivo', this.arquivoFoto);
    }

    this.estudantesService.criar(formData).subscribe({
      next: () => {
        this.loading.set(false);
        this.salvo.emit();
        this.emitirFechar();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.erro.set(err.error?.message || 'Erro ao cadastrar o aluno.');
      }
    });
  }

  /** Controla o asterisco (*) no label: mostra quando inválido, independente de toque. */
  deveMostrarObrigatorio(controlName: string): boolean {
    const control = this.form.get(controlName);
    return control?.invalid ?? false;
  }

  /** Controla bordas vermelhas e mensagens: apenas após o campo ter sido tocado. */
  isCampoInvalido(controlName: string): boolean {
    const control = this.form.get(controlName);
    return (control?.invalid && control?.touched) ?? false;
  }
}
