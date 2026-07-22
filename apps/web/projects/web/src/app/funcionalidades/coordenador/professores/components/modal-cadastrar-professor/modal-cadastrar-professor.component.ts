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
import { EducadoresService } from '../../../../../compartilhado/services/educadores.service';
import { TurmasService, TurmaResumo } from '../../../../../nucleo/services/turmas.service';
import { CustomValidators } from '../../../../../compartilhado/validators/custom-validators';

@Component({
  selector: 'app-modal-cadastrar-professor',
  imports: [ReactiveFormsModule],
  templateUrl: './modal-cadastrar-professor.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalCadastrarProfessorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private educadorService = inject(EducadoresService);
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
  turmasSelecionadas = signal<TurmaResumo[]>([]);
  mostrarDropdownTurmas = signal(false);

  ngOnInit() {
    this.initForm();
    this.carregarTurmas();
  }

  initForm() {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3), CustomValidators.textoInvalido()]],
      matricula: ['', Validators.required],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      tipo: ['', Validators.required],
      dataContratacao: ['', Validators.required],
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
    if (!this.turmasSelecionadas().find(t => t.id === turma.id)) {
      this.turmasSelecionadas.update((atuais) => [...atuais, turma]);
    }
    this.mostrarDropdownTurmas.set(false);
    this.termoBuscaTurma.set('');
    this.turmasFiltradas.set(this.turmas());
  }

  removerTurma(turma: TurmaResumo) {
    this.turmasSelecionadas.update((atuais) => atuais.filter(t => t.id !== turma.id));
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
    if (valores['nome']) valores['nome'] = valores['nome'].trim();
    const payload = {
      ...valores,
      turmaIds: this.turmasSelecionadas().map(t => t.id)
    };

    this.educadorService.criar(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.salvo.emit();
        this.emitirFechar();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.erro.set(err.error?.message || 'Erro ao cadastrar o educador.');
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
