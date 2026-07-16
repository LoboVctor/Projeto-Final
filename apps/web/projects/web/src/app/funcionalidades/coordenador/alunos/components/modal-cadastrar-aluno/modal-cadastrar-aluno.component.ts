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
import { EstudantesService } from '../../../../../compartilhado/services/estudantes.service';
import { TurmasService, TurmaResumo } from '../../../../../nucleo/services/turmas.service';

@Component({
  selector: 'app-modal-cadastrar-aluno',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  mostrarDropdownTurmas = false;
  turmaSelecionada: TurmaResumo | null = null;
  arquivoFoto: File | null = null;
  previewFoto: string | ArrayBuffer | null = null;

  ngOnInit() {
    this.initForm();
    this.carregarTurmas();
  }

  initForm() {
    this.form = this.fb.group({
      nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
      matricula: ['', Validators.required],
      cpf: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      dataNascimento: ['', Validators.required],
      sexo: ['', Validators.required],
      formaComunicacao: ['', Validators.required],
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
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.erro = '';
    
    const formData = new FormData();
    Object.keys(this.form.value).forEach(key => {
      formData.append(key, this.form.value[key]);
    });

    if (this.turmaSelecionada) {
      formData.append('turmaId', this.turmaSelecionada.id);
    }
    
    if (this.arquivoFoto) {
      formData.append('arquivo', this.arquivoFoto);
    }

    this.estudantesService.criar(formData).subscribe({
      next: () => {
        this.loading = false;
        this.salvo.emit();
        this.emitirFechar();
      },
      error: (err: any) => {
        this.loading = false;
        this.erro = err?.error?.message || 'Erro ao cadastrar o aluno.';
      }
    });
  }

  deveMostrarObrigatorio(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !control?.valid && (control?.touched || false);
  }
}
