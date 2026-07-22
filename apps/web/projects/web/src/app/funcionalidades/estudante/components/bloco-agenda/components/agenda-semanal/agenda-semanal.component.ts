import { Component, ChangeDetectionStrategy, inject, OnInit, input, signal, computed } from '@angular/core';
import { NgClass, DatePipe, SlicePipe } from '@angular/common';
import { EstudantesService } from '../../../../../../compartilhado/services/estudantes.service';
import { AuthService } from '../../../../../../nucleo/services/auth';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../../../../nucleo/config/api.config';
import { DiaAgenda, EventoAgenda } from '../../../../../../compartilhado/models/estudante-agenda.model';

function textoInvalido(valor: string): boolean {
  const normalizado = valor.trim();
  if (!normalizado) return true;
  if (/^\d+$/.test(normalizado)) return true;
  if (/^-+$/.test(normalizado)) return true;
  return false;
}

function getDiaUtilValido(date: Date): Date {
  const adjusted = new Date(date);
  adjusted.setHours(0, 0, 0, 0); 
  if (adjusted.getDay() === 0) adjusted.setDate(adjusted.getDate() - 2); 
  if (adjusted.getDay() === 6) adjusted.setDate(adjusted.getDate() - 1); 
  return adjusted;
}

@Component({
  selector: 'app-agenda-semanal',
  imports: [NgClass, DatePipe, SlicePipe],
  templateUrl: './agenda-semanal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgendaSemanalComponent implements OnInit {
  estudanteId = input.required<string>(); 
  private estudantesService = inject(EstudantesService);

  carregando = signal(true);
  agenda = signal<DiaAgenda[]>([]);

  dataBase = signal<Date>(getDiaUtilValido(new Date()));
  visaoAtiva = signal<'dia' | 'semana'>('semana');

  agendaFiltrada = computed(() => {
    const visao = this.visaoAtiva();
    const dados = this.agenda();
    
    const diasUteis = dados.filter((d: DiaAgenda) => {
      const [ano, mes, dia] = d.data.split('-').map(Number);
      const dataObj = new Date(ano!, mes! - 1, dia!);
      const diaSemana = dataObj.getDay();
      return diaSemana >= 1 && diaSemana <= 5;
    });

    if (visao === 'dia') {
      const baseIso = this.formatarDataLocal(this.dataBase());
      return diasUteis.filter((d: DiaAgenda) => d.data === baseIso);
    }
    
    return diasUteis;
  });

  podeNavegarProximo = computed<boolean>(() => {
    const dataAtual = this.dataBase();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    if (this.visaoAtiva() === 'dia') {
      const amanha = new Date(dataAtual);
      do {
        amanha.setDate(amanha.getDate() + 1);
      } while (amanha.getDay() === 0 || amanha.getDay() === 6);
      
      return amanha <= hoje;
    } else {
      const inicioSemanaAtual = new Date(dataAtual);
      inicioSemanaAtual.setDate(inicioSemanaAtual.getDate() - inicioSemanaAtual.getDay());
      inicioSemanaAtual.setHours(0, 0, 0, 0);
      
      const inicioSemanaHoje = new Date(hoje);
      inicioSemanaHoje.setDate(inicioSemanaHoje.getDate() - inicioSemanaHoje.getDay());
      inicioSemanaHoje.setHours(0, 0, 0, 0);
      
      return inicioSemanaAtual < inicioSemanaHoje;
    }
  });

  ngOnInit() {
    this.carregarAgenda();
  }

  carregarAgenda() {
    const id = this.estudanteId();
    if (!id) return;

    this.carregando.set(true);
    const dataIso = this.formatarDataLocal(this.dataBase());

    this.estudantesService.getAgendaSemana(id, dataIso).subscribe({
      next: (dados: DiaAgenda[]) => {
        this.agenda.set(dados);
        
        const total = dados.reduce((acumulador: number, dia: DiaAgenda) => acumulador + dia.eventos.length, 0);
        this.estudantesService.totalEventosSemana.set(total);
        
        this.carregando.set(false);
      },
      error: (err: unknown) => {
        console.error('Erro ao buscar a agenda:', err);
        this.carregando.set(false);
      }
    });
  }

  navegar(direcao: number) {
    if (direcao === 1 && !this.podeNavegarProximo()) return;

    let novaData = new Date(this.dataBase());
    const visao = this.visaoAtiva();

    if (visao === 'dia') {
      do {
        novaData.setDate(novaData.getDate() + direcao);
      } while (novaData.getDay() === 0 || novaData.getDay() === 6);
    } else {
      novaData.setDate(novaData.getDate() + direcao * 7);
    }

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    if (novaData > hoje) {
      novaData = getDiaUtilValido(new Date());
    }

    this.dataBase.set(novaData);
    this.carregarAgenda();
  }

  irParaHoje() {
    this.dataBase.set(getDiaUtilValido(new Date()));
    this.carregarAgenda();
  }

  mudarVisao(visao: 'dia' | 'semana') {
    this.visaoAtiva.set(visao);
    this.carregarAgenda();
  }

  formatarDataLocal(date: Date): string {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private readonly authService = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  modalAdicionarAberto = signal(false);
  salvandoAula = signal(false);
  aulaSalva = signal(false);

  novoNomeAula = signal('');
  novoDiaSemana = signal('SEGUNDA');
  novoHorarioInicio = signal('08:00');
  novoHorarioFim = signal('09:00');
  erroAdicionar = signal<string | null>(null);

  nomeAulaInvalido = computed(() => {
    const v = this.novoNomeAula();
    if (!v) return true;
    if (v.trim().length < 3) return true;
    return textoInvalido(v);
  });

  horarioInvalido = computed(() => {
    const inicio = this.novoHorarioInicio();
    const fim = this.novoHorarioFim();
    if (!inicio || !fim) return true;
    return fim <= inicio;
  });

  formAulaInvalido = computed(() => this.nomeAulaInvalido() || this.horarioInvalido());

  abrirModalAdicionarAula() {
    this.modalAdicionarAberto.set(true);
    this.erroAdicionar.set(null);
    this.novoNomeAula.set('');
    this.aulaSalva.set(false);
  }

  fecharModalAdicionarAula() {
    this.modalAdicionarAberto.set(false);
  }

  setNovoNomeAula(event: Event) {
    this.novoNomeAula.set((event.target as HTMLInputElement).value);
  }

  setNovoDiaSemana(event: Event) {
    this.novoDiaSemana.set((event.target as HTMLSelectElement).value);
  }

  setNovoHorarioInicio(event: Event) {
    this.novoHorarioInicio.set((event.target as HTMLInputElement).value);
  }

  setNovoHorarioFim(event: Event) {
    this.novoHorarioFim.set((event.target as HTMLInputElement).value);
  }

  salvarNovaAula() {
    const educadorId = this.authService.getLoggedUserId();
    if (!educadorId) {
      this.erroAdicionar.set('Você precisa estar logado como educador.');
      return;
    }

    if (this.formAulaInvalido()) {
      this.erroAdicionar.set('Verifique os campos obrigatórios.');
      return;
    }

    const inicio = this.novoHorarioInicio();
    const fim = this.novoHorarioFim();
    const diaSelecionado = this.novoDiaSemana();
    const diasAgenda = this.agenda();
    const diaEncontrado = diasAgenda.find((d: DiaAgenda) => d.diaSemana === diaSelecionado);
    
    if (diaEncontrado && diaEncontrado.eventos && diaEncontrado.eventos.length > 0) {
      const conflito = diaEncontrado.eventos.find((e: EventoAgenda) => {
        const eInicio = e.horarioInicio ?? '';
        const eFim = e.horarioFim ?? '';
        return inicio < eFim && fim > eInicio;
      });
      if (conflito) {
        this.erroAdicionar.set(
          `Conflito de horário: já existe a aula "${conflito.titulo}" entre ${conflito.horarioInicio}–${conflito.horarioFim} nesse dia.`
        );
        return;
      }
    }

    this.salvandoAula.set(true);
    this.erroAdicionar.set(null);

    const payload = {
      educadorId,
      nome: this.novoNomeAula(),
      diaSemana: this.novoDiaSemana(),
      horarioInicio: inicio,
      horarioFim: fim
    };

    this.http.post(`${this.baseUrl}/estudantes/${this.estudanteId()}/aulas`, payload)
      .subscribe({
        next: () => {
          this.salvandoAula.set(false);
          this.aulaSalva.set(true);
          setTimeout(() => {
            this.fecharModalAdicionarAula();
            this.carregarAgenda(); 
          }, 1500);
        },
        error: (err: unknown) => {
          this.salvandoAula.set(false);
          const message = err instanceof Error ? err.message : 'Erro ao salvar a aula.';
          this.erroAdicionar.set(message);
        }
      });
  }
}