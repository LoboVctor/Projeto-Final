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
    // Tenta isolar o CPF apenas com números se vier formatado
    let cpfLimpo = this.visaoGeralData?.cpf?.replace(/\D/g, '') || '';
    // Se o CPF original do backend estava obfuscado (ex: ***.***.123-45),
    // o usuário terá que redigitar, ou o backend precisaria enviar sem ofuscar.
    // Como a listagem ofusca o CPF no backend (`***.***.XXX`), precisaremos deixar o form flexível
    // ou assumir que o usuário só irá atualizar o CPF se for limpar e digitar de novo.
    // A melhor prática num cenário real seria buscar o estudante cru,
    // mas usaremos o cpf do jeito que está, e só obrigamos padrão se ele for preenchido com 11 digitos limpos
    // se vier obfuscado, limpamos e deixamos vazio para o usuário preencher se necessário.
    if (cpfLimpo.length < 11) {
      cpfLimpo = '';
    }

    // A data de nascimento vem como string ISO no backend
    let dataNascimentoFormatada = '';
    if (this.visaoGeralData?.dataNascimento) {
      const d = new Date(this.visaoGeralData.dataNascimento);
      dataNascimentoFormatada = d.toISOString().split('T')[0] || '';
    }

    this.form = this.fb.group({
      nomeCompleto: [this.visaoGeralData?.nomeCompleto || '', [Validators.required, Validators.minLength(3)]],
      matricula: [this.visaoGeralData?.matricula || '', Validators.required],
      // O modelo EstudanteVisaoGeral tem CPF ofuscado, e não traz matrícula. Para evitar quebrar, vamos deixar cpf flexível ou vazio
      cpf: [cpfLimpo, [Validators.pattern(/^\d{11}$/)]],
      dataNascimento: [dataNascimentoFormatada, Validators.required],
      sexo: [this.visaoGeralData?.sexo || '', Validators.required],
      formaComunicacao: [this.visaoGeralData?.formaComunicacao || '', Validators.required],

      nomeResponsavel: [this.visaoGeralData?.responsavel?.nomeCompleto || '', Validators.required],
      cpfResponsavel: [this.visaoGeralData?.responsavel?.cpf || '', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      telefoneResponsavel: [this.visaoGeralData?.responsavel?.telefone || '', Validators.required],
      emailResponsavel: [this.visaoGeralData?.responsavel?.email || '', [Validators.required, Validators.email]],
      enderecoResponsavel: [this.visaoGeralData?.responsavel?.endereco || '', Validators.required],
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
    Object.keys(this.form.value).forEach(key => {
      // Se cpf está vazio, não mandar para não sobreescrever com vazio
      if (key === 'cpf' && !this.form.value[key]) {
        return;
      }
      formData.append(key, this.form.value[key]);
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

  deveMostrarObrigatorio(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !control?.valid && (control?.touched || false);
  }
}
