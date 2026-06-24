import { Component, inject, OnInit, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { EstudantesService } from '../../../../../../compartilhado/services/estudantes.service';

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
      const baseIso = this.dataBase().toISOString().substring(0, 10);
      return dados.filter(d => d.data === baseIso);
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
    const dataIso = this.dataBase().toISOString().substring(0, 10);

    this.estudantesService.getAgendaSemana(id, dataIso).subscribe({
      next: (dados: any) => {
        this.agenda.set(dados);
        
        // Atualiza o Signal global no serviço
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

  mudarSemana(direcao: number) {
    const novaData = new Date(this.dataBase());
    novaData.setDate(novaData.getDate() + (direcao * 7));
    this.dataBase.set(novaData);
    this.carregarAgenda();
  }

  irParaHoje() {
    this.dataBase.set(new Date());
    this.carregarAgenda();
  }

  mudarVisao(visao: 'dia' | 'semana' | 'mes') {
    this.visaoAtiva.set(visao);
  }
}
