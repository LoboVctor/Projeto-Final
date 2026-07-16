import { Component, inject, OnInit, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common'; 
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

@Component({
  selector: 'app-agenda-semanal',
  standalone: true,
  imports: [CommonModule], 
  templateUrl: './agenda-semanal.component.html'
})
export class AgendaSemanalComponent implements OnInit {
  estudanteId = input.required<string>(); 
  private estudantesService = inject(EstudantesService);

  carregando = signal(true);
  agenda = signal<DiaAgenda[]>([]);

  dataBase = signal<Date>(new Date());
  visaoAtiva = signal<'dia' | 'semana'>('semana');

  agendaFiltrada = computed(() => {
    const visao = this.visaoAtiva();
    const dados = this.agenda();
    
    if (visao === 'dia') {
      const baseIso = this.formatarDataLocal(this.dataBase());
      return dados.filter((d: DiaAgenda) => d.data === baseIso);
    }
    
    return dados;
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

  /** Avança na direção correta de acordo com o modo de visualização ativo */
  navegar(direcao: number) {
    const novaData = new Date(this.dataBase());
    const visao = this.visaoAtiva();

    if (visao === 'dia') {
      novaData.setDate(novaData.getDate() + direcao);
    } else {
      novaData.setDate(novaData.getDate() + direcao * 7);
    }

    this.dataBase.set(novaData);
    this.carregarAgenda();
  }

  irParaHoje() {
    this.dataBase.set(new Date());
    this.carregarAgenda();
  }

  mudarVisao(visao: 'dia' | 'semana') {
    this.visaoAtiva.set(visao);
    this.carregarAgenda();
  }

  /** Formata a data no padrão local (YYYY-MM-DD) sem conversão UTC */
  formatarDataLocal(date: Date): string {
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  // --- Lógica do Modal Adicionar Aula ---
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

  formAulaInvalido = computed(() =>
    this.nomeAulaInvalido() || this.horarioInvalido()
  );

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

    // Validar horário duplicado: checar se já existe aula no mesmo dia com sobreposicão
    const inicio = this.novoHorarioInicio();
    const fim = this.novoHorarioFim();

    const diaSelecionado = this.novoDiaSemana();
    const diasAgenda = this.agenda();
    const diaEncontrado = diasAgenda.find((d: DiaAgenda) => d.diaSemana === diaSelecionado);
    if (diaEncontrado && diaEncontrado.eventos && diaEncontrado.eventos.length > 0) {
      const conflito = diaEncontrado.eventos.find((e: EventoAgenda) => {
        const eInicio = e.horarioInicio ?? '';
        const eFim = e.horarioFim ?? '';
        // Sobreposicão: novo inicio < fim existente E novo fim > inicio existente
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
            this.carregarAgenda(); // recarrega a agenda
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

