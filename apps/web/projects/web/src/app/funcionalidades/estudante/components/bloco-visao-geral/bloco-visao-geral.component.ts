import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  WritableSignal,
  input,
  output,
  signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  EstudanteVisaoGeral,
  EspecificidadeVisaoGeral } from '../../../../compartilhado/models/estudante-visao-geral.model';
import { EspecificidadeModalComponent } from './modais/especificidade-modal/especificidade-modal.component';
import { ModalEditarAlunoComponent } from './modais/modal-editar-aluno/modal-editar-aluno.component';

import { AuthService } from '../../../../nucleo/services/auth';

@Component({
  selector: 'app-bloco-visao-geral',
  imports: [DatePipe, EspecificidadeModalComponent, ModalEditarAlunoComponent],
  templateUrl: './bloco-visao-geral.component.html',
  styleUrls: ['./bloco-visao-geral.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class BlocoVisaoGeralComponent implements OnInit {
  private authService = inject(AuthService);

  readonly visaoGeralData = input<EstudanteVisaoGeral | null>(null);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);

  readonly recolher = output<void>();
  readonly fechar = output<void>();
  readonly tentarNovamente = output<void>();

  showModalEspecificidade = signal(false);
  especificidadeParaEditar = signal<EspecificidadeVisaoGeral | null>(null);

  showModalEditarAluno = signal(false);

  paginaGatilhos = signal(0);
  paginaComportamentos = signal(0);
  paginaProtocolos = signal(0);

  userRole = signal<'PROFESSOR' | 'COORDENADOR'>('PROFESSOR');

  ngOnInit() {
    this.userRole.set((this.authService.getRole() as 'PROFESSOR' | 'COORDENADOR') || 'PROFESSOR');
  }

  editarInformacoes(): void {
    this.showModalEditarAluno.set(true);
  }

  fecharModalEditarAluno(): void {
    this.showModalEditarAluno.set(false);
  }

  onAlunoEditado(): void {
    this.fecharModalEditarAluno();
    this.tentarNovamente.emit();
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
    this.showModalEspecificidade.set(true);
  }

  fecharModalEspecificidade(): void {
    this.showModalEspecificidade.set(false);
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
