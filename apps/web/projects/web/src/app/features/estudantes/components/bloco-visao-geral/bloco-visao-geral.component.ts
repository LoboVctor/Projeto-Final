import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstudanteVisaoGeral, EspecificidadeVisaoGeral } from '../../../../shared/models/estudante-visao-geral.model';
import { EspecificidadeModalComponent } from './modais/especificidade-modal/especificidade-modal.component';

@Component({
  selector: 'app-bloco-visao-geral',
  standalone: true,
  imports: [CommonModule, EspecificidadeModalComponent],
  templateUrl: './bloco-visao-geral.component.html',
  styleUrls: ['./bloco-visao-geral.component.css']
})
export class BlocoVisaoGeralComponent {
  @Input() visaoGeralData: EstudanteVisaoGeral | null = null;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  @Output() recolher = new EventEmitter<void>();
  @Output() fechar = new EventEmitter<void>();
  @Output() tentarNovamente = new EventEmitter<void>();

  showModalEspecificidade = false;
  especificidadeParaEditar: EspecificidadeVisaoGeral | null = null;

  // Mock de perfil. No futuro, isso deverá ser substituído pela injeção 
  // de um AuthService ou UserContext para pegar o perfil real do usuário logado.
  userRole: 'PROFESSOR' | 'COORDENADOR' = 'PROFESSOR';

  get especificidadesFiltradas(): EspecificidadeVisaoGeral[] {
    if (!this.visaoGeralData?.especificidades) return [];
    return this.visaoGeralData.especificidades.filter(e => 
      e.tipo === 'GATILHO_CRISE' || 
      e.tipo === 'COMPORTAMENTO_ATIPICO' || 
      (e.tipo === 'RESTRICAO' && e.categoria === 'COMPORTAMENTAL')
    );
  }

  get gatilhos(): EspecificidadeVisaoGeral[] {
    return this.especificidadesFiltradas.filter(e => e.tipo === 'GATILHO_CRISE');
  }

  get comportamentosAtipicos(): EspecificidadeVisaoGeral[] {
    return this.especificidadesFiltradas.filter(e => e.tipo === 'COMPORTAMENTO_ATIPICO');
  }

  get protocolosContencao(): EspecificidadeVisaoGeral[] {
    return this.especificidadesFiltradas.filter(e => e.tipo === 'RESTRICAO' && e.categoria === 'COMPORTAMENTAL');
  }

  getDisplayTipo(tipo: string): string {
    switch (tipo) {
      case 'GATILHO_CRISE': return 'Gatilho';
      case 'COMPORTAMENTO_ATIPICO': return 'Comportamento Atípico';
      case 'RESTRICAO': return 'Protocolo de Contenção';
      default: return tipo;
    }
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
    // Reutilizamos a lógica de recarregar do parent
    this.tentarNovamente.emit();
  }
}
