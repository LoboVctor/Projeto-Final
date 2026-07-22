import {
  Component,
  inject,
  input,
  output,
  signal,
  computed,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EstudantesService } from '../../../../compartilhado/services/estudantes.service';
import { EducadoresService } from '../../../../compartilhado/services/educadores.service';
import type { EducadorResumo, EstudoCasoPayload } from '../../../../compartilhado/models/gerenciamento-alunos.model';

@Component({
  selector: 'app-estudo-de-caso-drawer',
  imports: [FormsModule],
  templateUrl: './estudo-de-caso-drawer.component.html',
  styleUrls: ['./estudo-de-caso-drawer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudoDeCasoDrawerComponent implements OnInit {
  private readonly estudantesService = inject(EstudantesService);
  private readonly educadoresService = inject(EducadoresService);

  /** ID do estudante ao qual o Estudo de Caso será vinculado */
  readonly estudanteId = input.required<string>();

  /** Nome do estudante exibido no cabeçalho do drawer */
  readonly estudanteNome = input<string>('');

  /** Emitido quando o drawer deve fechar */
  readonly fechar = output<void>();

  /** Emitido após salvar com sucesso, passando o ID do estudo criado */
  readonly salvoComSucesso = output<string>();

  // ─── Estado do formulário ─────────────────────────────────────
  dataReuniao = signal('');
  parecerDecisao = signal('');
  educadoresSelecionados = signal<string[]>([]);
  parecerTouched = signal(false);

  // ─── Estado de UI ─────────────────────────────────────────────
  loading = signal(false);
  erro = signal<string | null>(null);
  sucesso = signal(false);

  /** Lista de educadores disponíveis para vincular ao estudo de caso */
  educadoresDisponiveis = signal<EducadorResumo[]>([]);

  // ─── Paginação de Educadores ──────────────────────────────────
  paginaEducadores = signal(0);
  itensPorPagina = 6;

  totalPaginas = computed(() =>
    Math.ceil(this.educadoresDisponiveis().length / this.itensPorPagina)
  );

  educadoresPaginaAtual = computed(() => {
    const inicio = this.paginaEducadores() * this.itensPorPagina;
    return this.educadoresDisponiveis().slice(inicio, inicio + this.itensPorPagina);
  });

  ngOnInit(): void {
    this.educadoresService.listarResumo().subscribe({
      next: (educadores) => this.educadoresDisponiveis.set(educadores),
      error: () => this.educadoresDisponiveis.set([]),
    });
  }

  paginaAnterior(): void {
    if (this.paginaEducadores() > 0) {
      this.paginaEducadores.update(p => p - 1);
    }
  }

  proximaPagina(): void {
    if (this.paginaEducadores() < this.totalPaginas() - 1) {
      this.paginaEducadores.update(p => p + 1);
    }
  }

  onFechar(): void {
    this.fechar.emit();
    this.resetarFormulario();
  }

  toggleEducador(educadorId: string): void {
    this.educadoresSelecionados.update((ids) =>
      ids.includes(educadorId)
        ? ids.filter((id) => id !== educadorId)
        : [...ids, educadorId],
    );
  }

  isEducadorSelecionado(educadorId: string): boolean {
    return this.educadoresSelecionados().includes(educadorId);
  }

  /** Retorna a mensagem de erro ativa do campo Parecer e Decisão, ou null se válido */
  readonly errosParecer = computed<string | null>(() => {
    if (!this.parecerTouched()) return null;
    const valor = this.parecerDecisao();
    const trimado = valor.trim();

    if (valor.length === 0) {
      return 'O parecer é obrigatório.';
    }
    if (valor.length > 0 && trimado.length === 0) {
      return 'O parecer não pode conter apenas espaços em branco.';
    }
    if (/^\d+$/.test(trimado)) {
      return 'O parecer não pode conter apenas números.';
    }
    if (/^-+$/.test(trimado)) {
      return 'O parecer não pode conter apenas hífens.';
    }
    if (trimado.length < 10) {
      return 'O parecer deve ter pelo menos 10 caracteres.';
    }
    if (trimado.length > 3000) {
      return 'O parecer deve ter no máximo 3000 caracteres.';
    }
    return null;
  });

  get formularioValido(): boolean {
    const trimado = this.parecerDecisao().trim();
    return (
      this.dataReuniao().trim() !== '' &&
      trimado.length >= 10 &&
      trimado.length <= 3000 &&
      !/^\d+$/.test(trimado) &&
      !/^-+$/.test(trimado) &&
      this.educadoresSelecionados().length > 0
    );
  }

  salvar(): void {
    if (!this.formularioValido) return;

    this.loading.set(true);
    this.erro.set(null);

    const payload: EstudoCasoPayload = {
      estudanteId: this.estudanteId(),
      dataReuniao: this.dataReuniao().trim(),
      parecerDecisao: this.parecerDecisao().trim(),
      educadoresIds: this.educadoresSelecionados(),
    };

    this.estudantesService.criarEstudoCaso(payload).subscribe({
      next: (resposta: { id: string }) => {
        this.loading.set(false);
        this.sucesso.set(true);
        this.salvoComSucesso.emit(resposta.id);
        // Aguarda 1.5s para o usuário ver o feedback antes de fechar
        setTimeout(() => this.onFechar(), 1500);
      },
      error: () => {
        this.loading.set(false);
        this.erro.set('Não foi possível registrar o Estudo de Caso. Tente novamente.');
      },
    });
  }

  private resetarFormulario(): void {
    this.dataReuniao.set('');
    this.parecerDecisao.set('');
    this.educadoresSelecionados.set([]);
    this.parecerTouched.set(false);
    this.erro.set(null);
    this.sucesso.set(false);
    this.loading.set(false);
    this.paginaEducadores.set(0);
  }
}
