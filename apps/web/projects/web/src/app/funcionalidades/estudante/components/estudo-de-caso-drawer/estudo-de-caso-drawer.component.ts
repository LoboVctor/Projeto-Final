import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstudantesService } from '../../../../compartilhado/services/estudantes.service';
import type { EducadorResumo, EstudoCasoPayload } from '../../../../compartilhado/models/gerenciamento-alunos.model';

/**
 * MOCK: Lista de educadores simulada enquanto o endpoint GET /educadores
 * (Sprint 5 / Dev B) não está implementado.
 * Substituir pelo resultado de uma chamada à API quando disponível.
 */
const EDUCADORES_MOCK: EducadorResumo[] = [
  { id: 'b1e06c4b-b2b5-4b07-a8a5-1d8977c0a6b7', nome: 'Ana Paula Ribeiro' },
  { id: '73b5a195-236b-4f95-97e3-057bfb1d8d9b', nome: 'Carlos Mendes' },
  { id: 'a9c3b889-8b06-4b8c-b033-d8a4f944de34', nome: 'Fernanda Souza' },
  { id: 'f204c379-3c82-45e3-85b9-1e37bc2c9e78', nome: 'João Pedro Lima' },
  { id: 'd392942b-586b-4e89-8588-bb73634c0e66', nome: 'Mariana Costa' },
];

@Component({
  selector: 'app-estudo-de-caso-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estudo-de-caso-drawer.component.html',
  styleUrls: ['./estudo-de-caso-drawer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudoDeCasoDrawerComponent {
  private readonly estudantesService = inject(EstudantesService);

  /** ID do estudante ao qual o Estudo de Caso será vinculado */
  @Input({ required: true }) estudanteId!: string;

  /** Nome do estudante exibido no cabeçalho do drawer */
  @Input() estudanteNome: string = '';

  /** Emitido quando o drawer deve fechar */
  @Output() fechar = new EventEmitter<void>();

  /** Emitido após salvar com sucesso, passando o ID do estudo criado */
  @Output() salvoComSucesso = new EventEmitter<string>();

  // ─── Estado do formulário ─────────────────────────────────────
  dataReuniao = signal('');
  parecerDecisao = signal('');
  educadoresSelecionados = signal<string[]>([]);
  parecerTouched = signal(false);

  // ─── Estado de UI ─────────────────────────────────────────────
  loading = signal(false);
  erro = signal<string | null>(null);
  sucesso = signal(false);

  /** Lista de educadores disponíveis — alimentada por mock até endpoint estar pronto */
  readonly educadoresDisponiveis: EducadorResumo[] = EDUCADORES_MOCK;

  // ─── Paginação de Educadores ──────────────────────────────────
  paginaEducadores = signal(0);
  itensPorPagina = 6;

  totalPaginas = computed(() => 
    Math.ceil(this.educadoresDisponiveis.length / this.itensPorPagina)
  );

  educadoresPaginaAtual = computed(() => {
    const inicio = this.paginaEducadores() * this.itensPorPagina;
    return this.educadoresDisponiveis.slice(inicio, inicio + this.itensPorPagina);
  });

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
      estudanteId: this.estudanteId,
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
