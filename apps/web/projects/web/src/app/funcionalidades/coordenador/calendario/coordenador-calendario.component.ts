import { Component, OnInit, inject, signal, computed, effect, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CalendarioService, EventoCalendario } from '../../../compartilhado/services/calendario.service';
import { AuthService } from '../../../nucleo/services/auth';
import { ConfirmacaoService } from '../../../compartilhado/services/confirmacao.service';

function textoInvalido(valor: string): boolean {
  const normalizado = valor.trim();
  if (!normalizado) return true;
  if (/^\d+$/.test(normalizado)) return true;
  if (/^-+$/.test(normalizado)) return true;
  return false;
}

interface DiaCalendario {
  data: Date;
  isMesAtual: boolean;
  eventos: EventoCalendario[];
  isHoje: boolean;
}

interface PopupPosition {
  top: number;
  left: number;
  arrowOnTop: boolean;
  arrowSide: 'left' | 'right' | 'center';
}

@Component({
  selector: 'app-coordenador-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './coordenador-calendario.component.html',
})
export class CoordenadorCalendarioComponent implements OnInit {
  private readonly calendarioService = inject(CalendarioService);
  private readonly authService = inject(AuthService);
  private readonly confirmacaoService = inject(ConfirmacaoService);
  private readonly route = inject(ActivatedRoute);

  hoje = new Date();
  mesAtual = signal<number>(this.hoje.getMonth());
  anoAtual = signal<number>(this.hoje.getFullYear());
  eventosDoMes = signal<EventoCalendario[]>([]);
  loading = signal<boolean>(false);

  modalAberto = signal<boolean>(false);
  modoEdicao = signal<boolean>(false);
  eventoEmEdicaoId = signal<string | null>(null);
  salvandoEvento = signal<boolean>(false);
  erroForm = signal<string | null>(null);

  formTitulo = signal<string>('');
  formDescricao = signal<string>('');
  formData = signal<string>('');
  formHorario = signal<string>('');

  eventoSelecionado = signal<EventoCalendario | null>(null);
  popupPos = signal<PopupPosition | null>(null);

  diasDoCalendario = computed(() => this.gerarGrade(this.anoAtual(), this.mesAtual(), this.eventosDoMes()));
  nomeDoMes = computed(() => {
    const raw = new Date(this.anoAtual(), this.mesAtual()).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  });
  tituloModal = computed(() => this.modoEdicao() ? 'Editar Evento' : 'Novo Evento');

  tituloInvalido = computed(() => {
    const v = this.formTitulo();
    if (!v) return true;
    return textoInvalido(v);
  });

  descricaoInvalida = computed(() => {
    const v = this.formDescricao();
    if (!v) return false;
    return textoInvalido(v);
  });

  formInvalido = computed(() =>
    this.tituloInvalido() || !this.formData() || !this.formHorario() || this.descricaoInvalida()
  );

  constructor() {
    effect(() => { this.carregarEventos(this.mesAtual(), this.anoAtual()); }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    // Ação rápida da Home: se vier com ?abrirModal=true, abre o modal de novo evento
    if (this.route.snapshot.queryParams['abrirModal'] === 'true') {
      this.abrirModal();
    }
  }

  carregarEventos(mes: number, ano: number): void {
    const escolaId = this.authService.getEscolaId();
    if (!escolaId) return;
    this.loading.set(true);
    this.calendarioService.buscarEventosDoMes(mes, ano, escolaId).subscribe({
      next: (eventos) => { this.eventosDoMes.set(eventos); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  mudarMes(delta: number): void {
    const novaData = new Date(this.anoAtual(), this.mesAtual() + delta, 1);
    this.mesAtual.set(novaData.getMonth());
    this.anoAtual.set(novaData.getFullYear());
  }

  irParaHoje(): void { this.mesAtual.set(this.hoje.getMonth()); this.anoAtual.set(this.hoje.getFullYear()); }

  abrirModal(data?: Date): void {
    this.erroForm.set(null); this.modoEdicao.set(false); this.eventoEmEdicaoId.set(null);
    this.formTitulo.set(''); this.formDescricao.set(''); this.formHorario.set('');
    this.eventoSelecionado.set(null);
    if (data) {
      const padZero = (n: number) => n.toString().padStart(2, '0');
      this.formData.set(`${data.getFullYear()}-${padZero(data.getMonth() + 1)}-${padZero(data.getDate())}`);
    } else { this.formData.set(''); }
    this.modalAberto.set(true);
  }

  abrirModalEdicao(evento: EventoCalendario): void {
    this.erroForm.set(null); this.modoEdicao.set(true); this.eventoEmEdicaoId.set(evento.id);
    this.eventoSelecionado.set(null);
    const isoStr = evento.dataEvento;
    this.formData.set(isoStr.substring(0, 10)); this.formHorario.set(isoStr.substring(11, 16));
    this.formTitulo.set(evento.titulo); this.formDescricao.set(evento.descricao ?? '');
    this.modalAberto.set(true);
  }

  fecharModal(): void { this.modalAberto.set(false); this.modoEdicao.set(false); this.eventoEmEdicaoId.set(null); }

  abrirPopupEvento(evento: EventoCalendario, event: MouseEvent): void {
    event.stopPropagation();
    if (this.eventoSelecionado()?.id === evento.id) { this.eventoSelecionado.set(null); this.popupPos.set(null); return; }
    this.eventoSelecionado.set(evento);
    this.calcularPosicaoPopup(event);
  }

  private calcularPosicaoPopup(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const POPUP_W = 312, POPUP_H = 200, GAP = 8, MARGIN = 12;
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = rect.left + rect.width / 2 - POPUP_W / 2;
    left = Math.max(MARGIN, Math.min(left, vw - POPUP_W - MARGIN));
    const elementCenter = rect.left + rect.width / 2, popupCenter = left + POPUP_W / 2;
    let arrowSide: 'left' | 'right' | 'center';
    if (elementCenter < popupCenter - 40) arrowSide = 'left';
    else if (elementCenter > popupCenter + 40) arrowSide = 'right';
    else arrowSide = 'center';
    let top: number, arrowOnTop: boolean;
    if (rect.bottom + GAP + POPUP_H <= vh - MARGIN) { top = rect.bottom + GAP; arrowOnTop = true; }
    else { top = Math.max(MARGIN, rect.top - GAP - POPUP_H); arrowOnTop = false; }
    this.popupPos.set({ top, left, arrowOnTop, arrowSide });
  }

  fecharPopup(): void { this.eventoSelecionado.set(null); this.popupPos.set(null); }

  salvarEvento(): void {
    if (this.formInvalido()) {
      this.erroForm.set('Verifique os campos obrigatórios.'); return;
    }
    const educadorId = this.authService.getLoggedUserId();
    if (!educadorId) return;
    this.salvandoEvento.set(true); this.erroForm.set(null);
    const [ano, mes, dia] = this.formData().split('-').map(Number) as [number, number, number];
    const [horas, minutos] = this.formHorario().split(':').map(Number) as [number, number];
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dataEvento = `${ano}-${pad(mes)}-${pad(dia)}T${pad(horas)}:${pad(minutos)}:00`;
    const onSuccess = () => { this.salvandoEvento.set(false); this.fecharModal(); this.carregarEventos(this.mesAtual(), this.anoAtual()); };
    const onError = () => { this.salvandoEvento.set(false); this.erroForm.set('Erro ao salvar o evento. Tente novamente.'); };
    if (this.modoEdicao() && this.eventoEmEdicaoId()) {
      this.calendarioService.atualizarEvento(this.eventoEmEdicaoId()!, { titulo: this.formTitulo(), descricao: this.formDescricao(), dataEvento, educadorId }).subscribe({ next: onSuccess, error: onError });
    } else {
      this.calendarioService.criarEvento({ titulo: this.formTitulo(), descricao: this.formDescricao(), dataEvento, educadorId }).subscribe({ next: onSuccess, error: onError });
    }
  }

  async excluirEvento(id: string): Promise<void> {
    const confirmado = await this.confirmacaoService.confirmar({
      titulo: 'Excluir compromisso',
      mensagem: 'Tem certeza que deseja excluir este compromisso do calendário?',
      textoConfirmar: 'Excluir',
      textoCancelar: 'Cancelar',
      variante: 'danger' });
    if (!confirmado) return;

    this.calendarioService.removerEvento(id).subscribe({
      next: () => { this.fecharPopup(); this.carregarEventos(this.mesAtual(), this.anoAtual()); },
      error: () => alert('Erro ao excluir o evento. Tente novamente.'),
    });
  }

  getCorEvento(): string { return 'bg-[#F3E8FF] text-[#6C3CC9] border border-[#B79CED]/40 shadow-sm'; }

  private gerarGrade(ano: number, mes: number, eventos: EventoCalendario[]): DiaCalendario[] {
    const primeiroDia = new Date(ano, mes, 1), ultimoDia = new Date(ano, mes + 1, 0), dias: DiaCalendario[] = [];
    const diaDaSemanaInicio = primeiroDia.getDay();
    for (let i = diaDaSemanaInicio - 1; i >= 0; i--) dias.push(this.criarDia(new Date(ano, mes, -i), false, eventos));
    for (let i = 1; i <= ultimoDia.getDate(); i++) dias.push(this.criarDia(new Date(ano, mes, i), true, eventos));
    const diasRestantes = 42 - dias.length;
    for (let i = 1; i <= diasRestantes; i++) dias.push(this.criarDia(new Date(ano, mes + 1, i), false, eventos));
    return dias;
  }

  private criarDia(data: Date, isMesAtual: boolean, eventos: EventoCalendario[]): DiaCalendario {
    const isHoje = data.getDate() === this.hoje.getDate() && data.getMonth() === this.hoje.getMonth() && data.getFullYear() === this.hoje.getFullYear();
    const eventosDoDia = eventos.filter(e => {
      const partes = e.dataEvento.substring(0, 10).split('-').map(Number);
      return partes[2] === data.getDate() && (partes[1]! - 1) === data.getMonth() && partes[0] === data.getFullYear();
    });
    return { data, isMesAtual, isHoje, eventos: eventosDoDia };
  }
}
