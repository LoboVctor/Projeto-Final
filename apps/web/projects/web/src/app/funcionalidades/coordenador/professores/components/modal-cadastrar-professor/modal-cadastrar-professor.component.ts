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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { EducadoresService } from '../../../../../compartilhado/services/educadores.service';
import { TurmasService, TurmaResumo } from '../../../../../nucleo/services/turmas.service';
import { CustomValidators } from '../../../../../compartilhado/validators/custom-validators';

@Component({
  selector: 'app-modal-cadastrar-professor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
      this.mostrarDropdownTurmas = false;
    }
  }

  @Input() isOpen = false;
  @Output() fechar = new EventEmitter<void>();
  @Output() salvo = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  erro = '';
  turmas: TurmaResumo[] = [];
  turmasFiltradas: TurmaResumo[] = [];
  termoBuscaTurma = '';
  turmasSelecionadas: TurmaResumo[] = [];
  mostrarDropdownTurmas = false;

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
      },
      error: () => {
        this.erro = 'Não foi possível carregar as turmas.';
      }
    });
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
    if (!this.turmasSelecionadas.find(t => t.id === turma.id)) {
      this.turmasSelecionadas.push(turma);
    }
    this.mostrarDropdownTurmas = false;
    this.termoBuscaTurma = '';
    this.turmasFiltradas = this.turmas;
  }

  removerTurma(turma: TurmaResumo) {
    this.turmasSelecionadas = this.turmasSelecionadas.filter(t => t.id !== turma.id);
  }

  emitirFechar() {
    this.fechar.emit();
  }

  salvar() {
    if (this.form.invalid || this.loading) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.erro = '';
    // Aplica trim() nos campos de texto antes do envio (padrão da aba Saúde)
    const valores = { ...this.form.value };
    if (valores['nome']) valores['nome'] = valores['nome'].trim();
    const payload = {
      ...valores,
      turmaIds: this.turmasSelecionadas.map(t => t.id)
    };

    this.educadorService.criar(payload).subscribe({
      next: () => {
        this.loading = false;
        this.salvo.emit();
        this.emitirFechar();
      },
      error: (err: any) => {
        this.loading = false;
        this.erro = err?.error?.message || 'Erro ao cadastrar o educador.';
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
