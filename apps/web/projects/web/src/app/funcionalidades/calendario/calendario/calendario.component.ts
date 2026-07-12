import { Component, OnInit, inject, signal, computed, effect, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CalendarioService, EventoCalendario } from '../../../compartilhado/services/calendario.service';
import { AuthService } from '../../../nucleo/services/auth';

interface DiaCalendario {
  data: Date;
  isMesAtual: boolean;
  eventos: EventoCalendario[];
  isHoje: boolean;
}

/** Posição calculada do popup em pixels relativos à viewport */
interface PopupPosition {
  top: number;
  left: number;
  /** Indica se a seta do popup deve aparecer no topo (popup abaixo) ou embaixo (popup acima) */
  arrowOnTop: boolean;
  /** Indica se a seta está alinhada à esquerda ou direita do popup */
  arrowSide: 'left' | 'right' | 'center';
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './calendario.component.html'
})
export class CalendarioComponent implements OnInit {
  private readonly calendarioService = inject(CalendarioService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  // ─── Estados Reativos ───────────────────────────────────────────────────────
  hoje = new Date();
  mesAtual = signal<number>(this.hoje.getMonth());
  anoAtual = signal<number>(this.hoje.getFullYear());
  eventosDoMes = signal<EventoCalendario[]>([]);
  loading = signal<boolean>(false);

  // ─── Estados do Modal de Criação/Edição ─────────────────────────────────────
  modalAberto = signal<boolean>(false);
  modoEdicao = signal<boolean>(false);
  eventoEmEdicaoId = signal<string | null>(null);
  salvandoEvento = signal<boolean>(false);
  erroForm = signal<string | null>(null);

  // Form Model (criação e edição compartilham os mesmos campos)
  formTitulo = signal<string>('');
  formDescricao = signal<string>('');
  formData = signal<string>('');
  formHorario = signal<string>('');

  // ─── Estado do Popup de Detalhes ─────────────────────────────────────────────
  eventoSelecionado = signal<EventoCalendario | null>(null);
  popupPos = signal<PopupPosition | null>(null);

  // ─── Computed ────────────────────────────────────────────────────────────────
  diasDoCalendario = computed(() => {
    return this.gerarGrade(this.anoAtual(), this.mesAtual(), this.eventosDoMes());
  });

  nomeDoMes = computed(() => {
    const raw = new Date(this.anoAtual(), this.mesAtual()).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  });

  tituloModal = computed(() =>
    this.modoEdicao() ? 'Editar' : 'Criar'
  );

  constructor() {
    effect(() => {
      this.carregarEventos(this.mesAtual(), this.anoAtual());
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Ler query params vindos da Home (data e eventoId)
    const params = this.route.snapshot.queryParamMap;
    const dataParam = params.get('data');
    if (dataParam) {
      const partes = dataParam.split('-').map(Number);
      const ano = partes[0];
      const mes = partes[1];
      if (ano && mes) {
        this.anoAtual.set(ano);
        this.mesAtual.set(mes - 1); // 0-indexed
      }
    }
  }

  // ─── Carregamento ────────────────────────────────────────────────────────────

  carregarEventos(mes: number, ano: number): void {
    const escolaId = this.authService.getEscolaId();
    if (!escolaId) return;

    this.loading.set(true);
    this.calendarioService.buscarEventosDoMes(mes, ano, escolaId).subscribe({
      next: (eventos) => {
        this.eventosDoMes.set(eventos);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  // ─── Navegação ───────────────────────────────────────────────────────────────

  mudarMes(delta: number): void {
    const novaData = new Date(this.anoAtual(), this.mesAtual() + delta, 1);
    this.mesAtual.set(novaData.getMonth());
    this.anoAtual.set(novaData.getFullYear());
  }

  irParaHoje(): void {
    this.mesAtual.set(this.hoje.getMonth());
    this.anoAtual.set(this.hoje.getFullYear());
  }

  // ─── Modal de Criação ────────────────────────────────────────────────────────

  abrirModal(data?: Date): void {
    this.erroForm.set(null);
    this.modoEdicao.set(false);
    this.eventoEmEdicaoId.set(null);
    this.formTitulo.set('');
    this.formDescricao.set('');
    this.formHorario.set('');
    this.eventoSelecionado.set(null);

    if (data) {
      const padZero = (n: number) => n.toString().padStart(2, '0');
      this.formData.set(`${data.getFullYear()}-${padZero(data.getMonth() + 1)}-${padZero(data.getDate())}`);
    } else {
      this.formData.set('');
    }

    this.modalAberto.set(true);
  }

  /** Abre o modal no modo edição, pré-populado com os dados do evento */
  abrirModalEdicao(evento: EventoCalendario): void {
    this.erroForm.set(null);
    this.modoEdicao.set(true);
    this.eventoEmEdicaoId.set(evento.id);
    this.eventoSelecionado.set(null);

    // Extrai data e hora diretamente da string ISO local (sem conversão UTC)
    const isoStr = evento.dataEvento; // ex: "2026-07-10T14:00:00"
    this.formData.set(isoStr.substring(0, 10));
    // Usa horarioInicio se disponível, senão extrai de dataEvento
    const horarioStr = evento.horarioInicio ? evento.horarioInicio.substring(11, 16) : isoStr.substring(11, 16);
    this.formHorario.set(horarioStr);
    this.formTitulo.set(evento.titulo);
    this.formDescricao.set(evento.descricao ?? '');

    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
    this.modoEdicao.set(false);
    this.eventoEmEdicaoId.set(null);
  }

  // ─── Popup de Detalhes ───────────────────────────────────────────────────────

  /**
   * Abre o popup de detalhes posicionado inteligentemente em relação ao
   * elemento da célula que foi clicado, evitando overflow nas bordas da tela.
   */
  abrirPopupEvento(evento: EventoCalendario, event: MouseEvent): void {
    event.stopPropagation();

    // Toggle: se já está aberto para este evento, fecha
    if (this.eventoSelecionado()?.id === evento.id) {
      this.eventoSelecionado.set(null);
      this.popupPos.set(null);
      return;
    }

    this.eventoSelecionado.set(evento);
    this.calcularPosicaoPopup(event);
  }

  private calcularPosicaoPopup(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    const POPUP_W = 312; // w-[312px]
    const POPUP_H = 200; // altura aproximada do popup
    const GAP = 8;       // espaço entre célula e popup
    const MARGIN = 12;   // margem mínima das bordas da tela

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // ── Posição horizontal ──
    // Tenta centralizar no elemento clicado, mas garante que não sai da tela
    let left = rect.left + rect.width / 2 - POPUP_W / 2;
    left = Math.max(MARGIN, Math.min(left, vw - POPUP_W - MARGIN));

    // Determina o lado da seta com base na posição horizontal do popup vs elemento
    const elementCenter = rect.left + rect.width / 2;
    const popupCenter = left + POPUP_W / 2;
    let arrowSide: 'left' | 'right' | 'center';
    if (elementCenter < popupCenter - 40) arrowSide = 'left';
    else if (elementCenter > popupCenter + 40) arrowSide = 'right';
    else arrowSide = 'center';

    // ── Posição vertical ──
    // Preferencialmente abre abaixo da célula; se não couber, abre acima
    let top: number;
    let arrowOnTop: boolean;

    if (rect.bottom + GAP + POPUP_H <= vh - MARGIN) {
      // Espaço suficiente abaixo → popup abaixo
      top = rect.bottom + GAP;
      arrowOnTop = true;
    } else {
      // Abre acima
      top = rect.top - GAP - POPUP_H;
      top = Math.max(MARGIN, top);
      arrowOnTop = false;
    }

    this.popupPos.set({ top, left, arrowOnTop, arrowSide });
  }

  fecharPopup(): void {
    this.eventoSelecionado.set(null);
    this.popupPos.set(null);
  }

  // ─── Salvar (Criar ou Editar) ────────────────────────────────────────────────

  salvarEvento(): void {
    if (!this.formTitulo().trim() || !this.formData() || !this.formHorario()) {
      this.erroForm.set('Título, Data e Horário são obrigatórios.');
      return;
    }

    const educadorId = this.authService.getLoggedUserId();
    if (!educadorId) return;

    this.salvandoEvento.set(true);
    this.erroForm.set(null);

    const [ano, mes, dia] = this.formData().split('-').map(Number) as [number, number, number];
    const [horas, minutos] = this.formHorario().split(':').map(Number) as [number, number];

    // Cria data local e ajusta para evitar problema de fuso horário
    const dataLocal = new Date(ano, mes - 1, dia, horas, minutos, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataEvento = `${ano}-${pad(mes)}-${pad(dia)}T${pad(horas)}:${pad(minutos)}:00.000Z`;

    const onSuccess = () => {
      this.salvandoEvento.set(false);
      this.fecharModal();
      this.carregarEventos(this.mesAtual(), this.anoAtual());
    };

    const onError = () => {
      this.salvandoEvento.set(false);
      this.erroForm.set('Erro ao salvar o evento. Tente novamente.');
    };

    if (this.modoEdicao() && this.eventoEmEdicaoId()) {
      // PATCH
      this.calendarioService.atualizarEvento(this.eventoEmEdicaoId()!, {
        titulo: this.formTitulo(),
        descricao: this.formDescricao(),
        dataEvento,
        educadorId
      }).subscribe({ next: onSuccess, error: onError });
    } else {
      // POST
      this.calendarioService.criarEvento({
        titulo: this.formTitulo(),
        descricao: this.formDescricao(),
        dataEvento,
        educadorId
      }).subscribe({ next: onSuccess, error: onError });
    }
  }

  excluirEvento(id: string): void {
    this.calendarioService.removerEvento(id).subscribe({
      next: () => {
        this.fecharPopup();
        this.carregarEventos(this.mesAtual(), this.anoAtual());
      },
      error: () => {
        alert('Erro ao excluir o evento. Tente novamente.');
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  getCorEvento(): string {
    return 'bg-[#F3E8FF] text-[#6C3CC9] border border-[#B79CED]/40 shadow-sm';
  }

  // ─── Grade do Calendário ─────────────────────────────────────────────────────

  private gerarGrade(ano: number, mes: number, eventos: EventoCalendario[]): DiaCalendario[] {
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const dias: DiaCalendario[] = [];

    const diaDaSemanaInicio = primeiroDia.getDay(); // 0 (Dom) a 6 (Sáb)
    for (let i = diaDaSemanaInicio - 1; i >= 0; i--) {
      dias.push(this.criarDia(new Date(ano, mes, -i), false, eventos));
    }

    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      dias.push(this.criarDia(new Date(ano, mes, i), true, eventos));
    }

    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) {
      dias.push(this.criarDia(new Date(ano, mes + 1, i), false, eventos));
    }

    return dias;
  }

  private criarDia(data: Date, isMesAtual: boolean, eventos: EventoCalendario[]): DiaCalendario {
    const isHoje = data.getDate() === this.hoje.getDate() &&
      data.getMonth() === this.hoje.getMonth() &&
      data.getFullYear() === this.hoje.getFullYear();

    const eventosDoDia = eventos.filter(e => {
      // Extrai ano, mês e dia direto da string ISO sem conversão de fuso horário
      const partes = e.dataEvento.substring(0, 10).split('-').map(Number);
      const eAno = partes[0]!;
      const eMes = partes[1]! - 1; // 0-indexed
      const eDia = partes[2]!;
      return eDia === data.getDate() &&
        eMes === data.getMonth() &&
        eAno === data.getFullYear();
    });

    return { data, isMesAtual, isHoje, eventos: eventosDoDia };
  }
}