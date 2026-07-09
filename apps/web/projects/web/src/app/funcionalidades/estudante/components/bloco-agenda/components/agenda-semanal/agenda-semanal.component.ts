import { Component, inject, OnInit, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { EstudantesService } from '../../../../../../compartilhado/services/estudantes.service';
import { AuthService } from '../../../../../../nucleo/services/auth';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../../../../nucleo/config/api.config';

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
  agenda = signal<any[]>([]);

  dataBase = signal<Date>(new Date());
  visaoAtiva = signal<'dia' | 'semana' | 'mes'>('semana');

  agendaFiltrada = computed(() => {
    const visao = this.visaoAtiva();
    const dados = this.agenda();
    
    if (visao === 'dia') {
      const baseIso = this.formatarDataLocal(this.dataBase());
      return dados.filter((d: any) => d.data === baseIso);
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
      next: (dados: any) => {
        this.agenda.set(dados);
        
        const total = dados.reduce((acumulador: number, dia: any) => acumulador + dia.eventos.length, 0);
        this.estudantesService.totalEventosSemana.set(total);
        
        this.carregando.set(false);
      },
      error: (err: any) => {
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
    } else if (visao === 'semana') {
      novaData.setDate(novaData.getDate() + direcao * 7);
    } else {
      // Mês: avança/recua para o mesmo dia no próximo/anterior mês
      novaData.setMonth(novaData.getMonth() + direcao);
    }

    this.dataBase.set(novaData);
    this.carregarAgenda();
  }

  irParaHoje() {
    this.dataBase.set(new Date());
    this.carregarAgenda();
  }

  mudarVisao(visao: 'dia' | 'semana' | 'mes') {
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

  abrirModalAdicionarAula() {
    this.modalAdicionarAberto.set(true);
    this.erroAdicionar.set(null);
    this.novoNomeAula.set('');
    this.aulaSalva.set(false);
  }

  fecharModalAdicionarAula() {
    this.modalAdicionarAberto.set(false);
  }

  setNovoNomeAula(event: any) {
    this.novoNomeAula.set(event.target.value);
  }

  setNovoDiaSemana(event: any) {
    this.novoDiaSemana.set(event.target.value);
  }

  setNovoHorarioInicio(event: any) {
    this.novoHorarioInicio.set(event.target.value);
  }

  setNovoHorarioFim(event: any) {
    this.novoHorarioFim.set(event.target.value);
  }

  salvarNovaAula() {
    const educadorId = this.authService.getLoggedUserId();
    if (!educadorId) {
      this.erroAdicionar.set('Você precisa estar logado como educador.');
      return;
    }

    this.salvandoAula.set(true);
    this.erroAdicionar.set(null);

    const payload = {
      educadorId,
      nome: this.novoNomeAula(),
      diaSemana: this.novoDiaSemana(),
      horarioInicio: this.novoHorarioInicio(),
      horarioFim: this.novoHorarioFim()
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
        error: (err: any) => {
          this.salvandoAula.set(false);
          this.erroAdicionar.set(err.error?.message || 'Erro ao salvar a aula.');
        }
      });
  }
}

