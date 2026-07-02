import {
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
  signal,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RegistrosDiariosService } from '../../../../compartilhado/services/registros-diarios.service';
import { AuthService } from '../../../../nucleo/services/auth';
import {
  DiaSemanaRegistro,
  RegistroDiario,
  RegistroDiarioPayload
} from '../../../../compartilhado/models/registros-diarios.models';
import { ObservacoesDiaComponent } from './components/observacoes-dia/observacoes-dia.component';
import { ScoreDiarioComponent } from './components/score-diario/score-diario.component';
import { AgendaSemanalComponent } from './components/agenda-semanal/agenda-semanal.component';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Mapeamento de campo do score para chave do RegistroDiario */
export type ScoreKey = keyof Pick<
  RegistroDiario,
  'scoreComportamento' | 'scoreInteracao' | 'scoreFoco' | 'scoreAutonomia' | 'statusAlimentacao' | 'usoBanheiro'
>;

function isValidUUID(uuid: string): boolean {
  if (!uuid) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid);
}

@Component({
  selector: 'app-bloco-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, ObservacoesDiaComponent, ScoreDiarioComponent, AgendaSemanalComponent],
  templateUrl: './bloco-agenda.component.html',
  styleUrls: ['./bloco-agenda.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlocoAgendaComponent implements OnInit, OnChanges {
  @Input({ required: true }) estudanteId!: string;
  @Output() recolher = new EventEmitter<void>();

  private readonly registrosService = inject(RegistrosDiariosService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  dataSelecionada = signal<Date>(new Date());

  semanaAtual = signal<DiaSemanaRegistro[]>([]);
  registroDoDia = signal<RegistroDiario | null>(null);
  loading = signal<boolean>(false);
  erroCarregamento = signal<string | null>(null);
  erroValidacao = signal<string | null>(null);

  saveStatusObservacoes = signal<SaveStatus>('idle');
  saveStatusScores = signal<SaveStatus>('idle');

  private saveTimerObservacoes?: ReturnType<typeof setTimeout>;
  private saveTimerScores?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.carregarSemana(this.dataSelecionada());
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['estudanteId'] && !changes['estudanteId'].isFirstChange()) {
      this.carregarSemana(this.dataSelecionada());
    }
  }

  carregarSemana(data: Date): void {
    this.loading.set(true);
    this.erroCarregamento.set(null);
    this.erroValidacao.set(null);
    const dataIso = this.formatDateLocal(data);

    this.registrosService.getSemana(this.estudanteId, dataIso).subscribe({
      next: (semana) => {
        this.semanaAtual.set(semana);
        this.atualizarRegistroDoDia();
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.erroCarregamento.set('Não foi possível carregar os registros da semana.');
        this.loading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  atualizarRegistroDoDia(): void {
    const dataAtualISO = this.formatDateLocal(this.dataSelecionada());
    const dia = this.semanaAtual().find(
      (d) => this.normalizeApiDate(d.data) === dataAtualISO
    );
    this.registroDoDia.set(dia?.registro ?? null);
  }

  mudarData(dias: number): void {
    const novaData = this.addDays(this.dataSelecionada(), dias);
    this.dataSelecionada.set(novaData);
    this.erroValidacao.set(null);

    if (this.dataEstaNaSemanaAtual(novaData)) {
      this.atualizarRegistroDoDia();
      this.cdr.markForCheck();
    } else {
      this.carregarSemana(novaData);
    }
  }

  onInputData(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target.value) return;

    const novaData = this.parseLocalDate(target.value);
    this.dataSelecionada.set(novaData);
    this.erroValidacao.set(null);

    if (this.dataEstaNaSemanaAtual(novaData)) {
      this.atualizarRegistroDoDia();
      this.cdr.markForCheck();
    } else {
      this.carregarSemana(novaData);
    }
  }

  private addDays(date: Date, amount: number): Date {
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    next.setDate(next.getDate() + amount);
    return next;
  }

  private parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year!, month! - 1, day!);
  }

  onSalvarAnotacao(novaAnotacao: string): void {
    this.salvarObservacoes(novaAnotacao);
  }

  onSalvarScores(novosScores: Partial<RegistroDiario>): void {
    this.salvarScoresData(novosScores);
  }

  salvarObservacoes(novaObservacao: string): void {
    this.erroValidacao.set(null);
    if (!this.validarIdentificadores()) return;

    const dataFormatada = this.formatDateLocal(this.dataSelecionada());
    console.log('Data selecionada na UI:', this.dataSelecionada());
    console.log('Data enviada ao backend:', dataFormatada);

    const atual = this.registroDoDia();
    const payload: RegistroDiarioPayload = {
      estudanteId: this.estudanteId,
      educadorId: this.authService.getLoggedUserId()!,
      data: dataFormatada,
      preenchido: true,
      scoreComportamento: atual?.scoreComportamento ?? 0,
      scoreInteracao: atual?.scoreInteracao ?? 0,
      scoreFoco: atual?.scoreFoco ?? 0,
      scoreAutonomia: atual?.scoreAutonomia ?? 0,
      statusAlimentacao: atual?.statusAlimentacao ?? 0,
      usoBanheiro: atual?.usoBanheiro ?? 0,
      anotacoes: novaObservacao
    };

    this.saveStatusObservacoes.set('saving');
    this.cdr.markForCheck();
    clearTimeout(this.saveTimerObservacoes);

    this.registrosService.salvarRegistro(payload).subscribe({
      next: (salvo) => {
        // Atualiza o registro local apenas para anotações, preservando scores atuais em tela
        const novoRegistroLocal = atual ? { ...atual, anotacoes: salvo.anotacoes } : salvo;
        this.registroDoDia.set(novoRegistroLocal);
        this.atualizarSemanaLocal(dataFormatada, novoRegistroLocal);

        this.saveStatusObservacoes.set('saved');
        this.erroValidacao.set(null);
        this.cdr.markForCheck();

        this.saveTimerObservacoes = setTimeout(() => {
          this.saveStatusObservacoes.set('idle');
          this.cdr.markForCheck();
        }, 2500);
      },
      error: () => this.tratarErroSalvamento('saveStatusObservacoes')
    });
  }

  salvarScoresData(novosScores: Partial<RegistroDiario>): void {
    this.erroValidacao.set(null);
    if (!this.validarIdentificadores()) return;

    const dataFormatada = this.formatDateLocal(this.dataSelecionada());
    console.log('Data selecionada na UI:', this.dataSelecionada());
    console.log('Data enviada ao backend:', dataFormatada);

    const atual = this.registroDoDia();
    
    // Removemos a propriedade id explicitamente para o backend não rejeitar o payload
    const { id, ...scoresSemId } = novosScores as any;

    const payload: RegistroDiarioPayload = {
      ...scoresSemId,
      estudanteId: this.estudanteId,
      educadorId: this.authService.getLoggedUserId()!,
      data: dataFormatada,
      preenchido: true,
      scoreComportamento: novosScores.scoreComportamento ?? atual?.scoreComportamento ?? 0,
      scoreInteracao: novosScores.scoreInteracao ?? atual?.scoreInteracao ?? 0,
      scoreFoco: novosScores.scoreFoco ?? atual?.scoreFoco ?? 0,
      scoreAutonomia: novosScores.scoreAutonomia ?? atual?.scoreAutonomia ?? 0,
      statusAlimentacao: novosScores.statusAlimentacao ?? atual?.statusAlimentacao ?? 0,
      usoBanheiro: novosScores.usoBanheiro ?? atual?.usoBanheiro ?? 0,
      anotacoes: atual?.anotacoes ?? ''
    };

    this.saveStatusScores.set('saving');
    this.cdr.markForCheck();
    clearTimeout(this.saveTimerScores);

    this.registrosService.salvarRegistro(payload).subscribe({
      next: (salvo) => {
        // Atualiza o registro local apenas para scores, preservando anotações atuais em tela
        const novoRegistroLocal = atual ? { ...atual, ...novosScores } : salvo;
        this.registroDoDia.set(novoRegistroLocal);
        this.atualizarSemanaLocal(dataFormatada, novoRegistroLocal);

        this.saveStatusScores.set('saved');
        this.erroValidacao.set(null);
        this.cdr.markForCheck();

        this.saveTimerScores = setTimeout(() => {
          this.saveStatusScores.set('idle');
          this.cdr.markForCheck();
        }, 2500);
      },
      error: () => this.tratarErroSalvamento('saveStatusScores')
    });
  }

  private validarIdentificadores(): boolean {
    if (!isValidUUID(this.estudanteId)) {
      this.erroValidacao.set('O identificador do estudante é inválido. Ação bloqueada.');
      this.cdr.markForCheck();
      console.warn('BlocoAgenda: estudanteId não é um UUID válido', this.estudanteId);
      return false;
    }

    const educadorId = this.authService.getLoggedUserId();
    if (!educadorId || !isValidUUID(educadorId)) {
      this.erroValidacao.set('Educador não autenticado ou com identificador inválido. Ação bloqueada.');
      this.cdr.markForCheck();
      console.warn('BlocoAgenda: educadorId não é um UUID válido', educadorId);
      return false;
    }

    return true;
  }

  private atualizarSemanaLocal(dataIso: string, novoRegistro: RegistroDiario): void {
    const semana = this.semanaAtual().map((d) =>
      this.normalizeApiDate(d.data) === dataIso ? { ...d, registro: novoRegistro } : d
    );
    this.semanaAtual.set(semana);
  }

  private tratarErroSalvamento(statusField: 'saveStatusObservacoes' | 'saveStatusScores'): void {
    if (statusField === 'saveStatusObservacoes') this.saveStatusObservacoes.set('error');
    if (statusField === 'saveStatusScores') this.saveStatusScores.set('error');
    this.erroValidacao.set('Ocorreu um erro técnico ao salvar os dados no servidor.');
    this.cdr.markForCheck();
  }

  private dataEstaNaSemanaAtual(data: Date): boolean {
    const semana = this.semanaAtual();
    if (semana.length === 0) return false;
    const dataIso = this.formatDateLocal(data);
    return semana.some((d) => this.normalizeApiDate(d.data) === dataIso);
  }

  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizeApiDate(value: string | Date): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    return this.formatDateLocal(value as Date);
  }

  get dataFormatada(): string {
    return this.dataSelecionada().toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  get dataInputValue(): string {
    return this.formatDateLocal(this.dataSelecionada());
  }
}

