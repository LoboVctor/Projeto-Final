import { Component, OnInit, inject, signal , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurmasService, TurmaResumo, EstudanteResumo, EstudantesPorTurmaResponse } from '../../../nucleo/services/turmas.service';
import { AuthService } from '../../../nucleo/services/auth';
import { DiagLabelPipe } from '../../../compartilhado/pipes/student.pipes';
import { GraficoDiagnosticosComponent } from '../components/grafico-diagnosticos/grafico-diagnosticos';
import { CardAlunoComponent } from '../../../compartilhado/components/card-aluno/card-aluno';
import { AlunoModalData } from '../../../compartilhado/models/aluno-modal.model';
import { AlunoModalComponent } from '../../../compartilhado/components/aluno-modal/aluno-modal.component';
type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-turmas-page',
  imports: [
    CommonModule,
    CardAlunoComponent,
    DiagLabelPipe,
    GraficoDiagnosticosComponent,
    AlunoModalComponent
  ],
  templateUrl: './turmas.component.html',
  styleUrls: ['./turmas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush })
export class TurmasComponent implements OnInit {
  private readonly turmasService = inject(TurmasService);
  private readonly authService = inject(AuthService);

  turmas = signal<TurmaResumo[]>([]);
  estudantes = signal<EstudanteResumo[]>([]);
  turmaSelecionada = signal<TurmaResumo | null>(null);
  viewMode = signal<ViewMode>('grid');
  loading = signal(false);
  error = signal<string | null>(null);
  isDropdownOpen = signal(false);

  ngOnInit(): void {
    this.carregarTurmas();
  }

  carregarTurmas(): void {
    const educadorId = this.authService.getLoggedUserId() ?? undefined;
    this.loading.set(true);
    this.turmasService.getTurmas(educadorId).subscribe({
      next: (turmas) => {
        this.turmas.set(turmas);
        this.loading.set(false);
        if (turmas.length > 0 && turmas[0]) this.selecionarTurma(turmas[0]);
      },
      error: () => {
        this.error.set('Erro ao carregar turmas. Verifique a conexão com a API.');
        this.loading.set(false);
      } });
  }

  selecionarTurma(turma: TurmaResumo): void {
    if (this.turmaSelecionada()?.id === turma.id) return;
    this.turmaSelecionada.set(turma);
    this.loading.set(true);
    this.turmasService.getEstudantesDaTurma(turma.id).subscribe({
      next: (res: EstudantesPorTurmaResponse) => {
        this.estudantes.set(res.estudantes);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar estudantes.');
        this.loading.set(false);
      } });
  }

  setView(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update(v => !v);
  }

  fecharDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  selecionarTurmaDropdown(turma: TurmaResumo): void {
    this.selecionarTurma(turma);
    this.isDropdownOpen.set(false);
  }

  alunoEmDestaque = signal<AlunoModalData | null>(null);

  abrirDetalhesAluno(estudante: EstudanteResumo): void {
    
    const nomeDaTurma = this.turmaSelecionada()?.nome || 'Turma Indefinida';
    
    const diagnosticoPrincipal = estudante.diagnosticos.length > 0 
      ? estudante.diagnosticos[0]?.diagnostico?.tipo || 'Sem Laudo'
      : 'Sem Laudo';

    const dadosParaModal: AlunoModalData = {
      id: estudante.id,
      nome: estudante.nomeCompleto,
      turma: nomeDaTurma,
      diagnostico: diagnosticoPrincipal,
      nivelSuporte: 'Nível 1 de Suporte',
      foto: estudante.foto || `https://ui-avatars.com/api/?name=${estudante.nomeCompleto}&background=F0E6FF&color=4A148C`
    };

    this.alunoEmDestaque.set(dadosParaModal);
  }

  calcularIdade(dataNascimento: string | Date | undefined): number | undefined {    
    if (!dataNascimento) return undefined;
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  }
}
