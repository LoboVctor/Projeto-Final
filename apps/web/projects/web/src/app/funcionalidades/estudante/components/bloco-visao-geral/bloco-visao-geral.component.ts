import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  WritableSignal,
  input,
  signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EstudanteVisaoGeral,
  EspecificidadeVisaoGeral } from '../../../../compartilhado/models/estudante-visao-geral.model';
import { EspecificidadeModalComponent } from './modais/especificidade-modal/especificidade-modal.component';

@Component({
  selector: 'app-bloco-visao-geral',
  imports: [CommonModule, EspecificidadeModalComponent],
  templateUrl: './bloco-visao-geral.component.html',
  styleUrls: ['./bloco-visao-geral.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class BlocoVisaoGeralComponent {
  readonly visaoGeralData = input<EstudanteVisaoGeral | null>(null);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);

  @Output() recolher = new EventEmitter<void>();
  @Output() fechar = new EventEmitter<void>();
  @Output() tentarNovamente = new EventEmitter<void>();

  showModalEspecificidade = false;
  especificidadeParaEditar: EspecificidadeVisaoGeral | null = null;

  paginaGatilhos = signal(0);
  paginaComportamentos = signal(0);
  paginaProtocolos = signal(0);

  userRole: 'PROFESSOR' | 'COORDENADOR' = 'PROFESSOR';

  editarInformacoes(): void {
    alert('Funcionalidade de edição de Informações Gerais em desenvolvimento.');
  }

  get especificidadesFiltradas(): EspecificidadeVisaoGeral[] {
    const visaoGeralData = this.visaoGeralData();
    if (!visaoGeralData?.especificidades) return [];
    return visaoGeralData.especificidades.filter(
      (e) =>
        e.tipo === 'GATILHO_CRISE' ||
        e.tipo === 'COMPORTAMENTO_ATIPICO' ||
        e.tipo === 'CONTENCAO');
  }

  get gatilhos(): EspecificidadeVisaoGeral[] {
    return this.especificidadesFiltradas.filter((e) => e.tipo === 'GATILHO_CRISE');
  }

  get comportamentosAtipicos(): EspecificidadeVisaoGeral[] {
    return this.especificidadesFiltradas.filter((e) => e.tipo === 'COMPORTAMENTO_ATIPICO');
  }

  get protocolosContencao(): EspecificidadeVisaoGeral[] {
    return this.especificidadesFiltradas.filter((e) => e.tipo === 'CONTENCAO');
  }

  getDisplayTipo(tipo: string): string {
    switch (tipo) {
      case 'GATILHO_CRISE':
        return 'Gatilho';
      case 'COMPORTAMENTO_ATIPICO':
        return 'Comportamento Atípico';
      case 'CONTENCAO':
        return 'Protocolo de Contenção';
      default:
        return tipo;
    }
  }

  classesCategoriaPorTipo(tipo: string): string {
    const tipoNormalizado = String(tipo).toLowerCase();

    if (tipoNormalizado.includes('gatilho')) {
      return 'bg-red-50 text-red-700 border border-red-200';
    }

    if (tipoNormalizado.includes('comportamento')) {
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    }

    if (tipoNormalizado.includes('contencao')) {
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }

    return 'bg-slate-50 text-slate-700 border border-slate-200';
  }

  formatarEtapa(etapa: string | undefined | null): string {
    if (!etapa) return 'Sem Etapa';
    const etapaLimpa = etapa.replace('_', ' ');
    return etapaLimpa.charAt(0).toUpperCase() + etapaLimpa.slice(1).toLowerCase();
  }

  onRecolher(): void {
    this.recolher.emit();
  }

  onFechar(): void {
    this.fechar.emit();
  }

  onTentarNovamente(): void {
    this.tentarNovamente.emit();
  }

  abrirModalEspecificidade(): void {
    this.showModalEspecificidade = true;
  }

  fecharModalEspecificidade(): void {
    this.showModalEspecificidade = false;
  }

  onEspecificidadeSalva(): void {
    this.fecharModalEspecificidade();
    this.paginaGatilhos.set(0);
    this.paginaComportamentos.set(0);
    this.paginaProtocolos.set(0);
    this.tentarNovamente.emit();
  }

  navegarPagina(paginaSignal: WritableSignal<number>, delta: number, total: number): void {
    const next = paginaSignal() + delta;
    if (next >= 0 && next < total) {
      paginaSignal.set(next);
    }
  }

  getItem(lista: EspecificidadeVisaoGeral[], pagina: number): EspecificidadeVisaoGeral | null {
    return lista[pagina] ?? null;
  }
}
