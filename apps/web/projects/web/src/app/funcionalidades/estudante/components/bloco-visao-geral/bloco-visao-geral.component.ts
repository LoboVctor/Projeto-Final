import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  EstudanteVisaoGeral,
  EspecificidadeVisaoGeral } from '../../../../compartilhado/models/estudante-visao-geral.model';
import { EspecificidadeModalComponent } from './modais/especificidade-modal/especificidade-modal.component';
import { ModalEditarAlunoComponent } from './modais/modal-editar-aluno/modal-editar-aluno.component';

import { AuthService } from '../../../../nucleo/services/auth';

@Component({
  selector: 'app-bloco-visao-geral',
  imports: [CommonModule, EspecificidadeModalComponent, ModalEditarAlunoComponent],
  templateUrl: './bloco-visao-geral.component.html',
  styleUrls: ['./bloco-visao-geral.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class BlocoVisaoGeralComponent implements OnInit {
  private authService = inject(AuthService);

  readonly visaoGeralData = input<EstudanteVisaoGeral | null>(null);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);

  @Output() recolher = new EventEmitter<void>();
  @Output() fechar = new EventEmitter<void>();
  @Output() tentarNovamente = new EventEmitter<void>();

  showModalEspecificidade = false;
  especificidadeParaEditar: EspecificidadeVisaoGeral | null = null;
  
  showModalEditarAluno = false;

  userRole: string = 'PROFESSOR';

  ngOnInit() {
    this.userRole = this.authService.getRole() || 'PROFESSOR';
  }

  editarInformacoes(): void {
    this.showModalEditarAluno = true;
  }

  fecharModalEditarAluno(): void {
    this.showModalEditarAluno = false;
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
    this.tentarNovamente.emit();
  }
}
