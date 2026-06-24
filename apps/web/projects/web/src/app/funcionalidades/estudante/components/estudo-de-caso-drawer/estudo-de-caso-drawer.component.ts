import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
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
  { id: '11111111-1111-1111-1111-111111111111', nome: 'Ana Paula Ribeiro' },
  { id: '22222222-2222-2222-2222-222222222222', nome: 'Carlos Mendes' },
  { id: '33333333-3333-3333-3333-333333333333', nome: 'Fernanda Souza' },
  { id: '44444444-4444-4444-4444-444444444444', nome: 'João Pedro Lima' },
  { id: '55555555-5555-5555-5555-555555555555', nome: 'Mariana Costa' },
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

  // ─── Estado de UI ─────────────────────────────────────────────
  loading = signal(false);
  erro = signal<string | null>(null);
  sucesso = signal(false);

  /** Lista de educadores disponíveis — alimentada por mock até endpoint estar pronto */
  readonly educadoresDisponiveis: EducadorResumo[] = EDUCADORES_MOCK;

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

  get formularioValido(): boolean {
    return (
      this.dataReuniao().trim() !== '' &&
      this.parecerDecisao().trim().length >= 10 &&
      this.educadoresSelecionados().length > 0
    );
  }

  salvar(): void {
    if (!this.formularioValido) return;

    this.loading.set(true);
    this.erro.set(null);

    const payload: EstudoCasoPayload = {
      estudanteId: this.estudanteId,
      dataReuniao: this.dataReuniao(),
      parecerDecisao: this.parecerDecisao(),
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
    this.erro.set(null);
    this.sucesso.set(false);
    this.loading.set(false);
  }
}
