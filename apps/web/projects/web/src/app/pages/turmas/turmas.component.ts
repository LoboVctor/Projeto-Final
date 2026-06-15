import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TurmasService, TurmaResumo, EstudanteResumo, EstudantesPorTurmaResponse } from '../../core/services/turmas.service';
import { AuthService } from '../../core/services/auth';
import { DiagLabelPipe } from '../../shared/pipes/student.pipes';
import { GraficoDiagnosticosComponent } from '../../features/turmas/components/grafico-diagnosticos/grafico-diagnosticos';
import { CardAlunoComponent } from '../../shared/components/card-aluno/card-aluno';
import { AlunoModalData } from '../../shared/models/aluno-modal.model';
import { AlunoModalComponent } from '../../shared/components/aluno-modal/aluno-modal.component';
type ViewMode = 'grid' | 'list';

@Component({
  selector: 'app-turmas-page',
  standalone: true,
  // CR-11: NgFor, NgIf e SlicePipe já estão incluídos no CommonModule — removidos os imports duplicados
  imports: [
    CommonModule,
    CardAlunoComponent,
    DiagLabelPipe,
    GraficoDiagnosticosComponent,
    AlunoModalComponent
  ],
  templateUrl: './turmas.component.html',
  styleUrls: ['./turmas.component.css'],
})
export class TurmasComponent implements OnInit {
  private readonly turmasService = inject(TurmasService);
  private readonly authService = inject(AuthService);

  turmas = signal<TurmaResumo[]>([]);
  estudantes = signal<EstudanteResumo[]>([]);
  turmaSelecionada = signal<TurmaResumo | null>(null);
  viewMode = signal<ViewMode>('grid');
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.carregarTurmas();
  }

  carregarTurmas(): void {
    // CR-06: filtra as turmas pelo educador autenticado via AuthService
    const educadorId = this.authService.getLoggedUserId() ?? undefined;
    this.loading.set(true);
    this.turmasService.getTurmas(educadorId).subscribe({
      next: (turmas) => {
        this.turmas.set(turmas);
        this.loading.set(false);
        // Se houver turmas, carrega automaticamente a primeira
        if (turmas.length > 0) this.selecionarTurma(turmas[0]);
      },
      error: () => {
        this.error.set('Erro ao carregar turmas. Verifique a conexão com a API.');
        this.loading.set(false);
      },
    });
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
      },
    });
  }

  setView(mode: ViewMode): void {
    this.viewMode.set(mode);
  }

  //  O signal  guarda o formato exato do modal
  alunoEmDestaque = signal<AlunoModalData | null>(null);

  // A função faz a transformação dos dados
  abrirDetalhesAluno(estudante: EstudanteResumo): void {
    
    // Pega o nome da turma que está selecionada na tela
    const nomeDaTurma = this.turmaSelecionada()?.nome || 'Turma Indefinida';
    
    // Pega o primeiro diagnóstico (se houver)
    const diagnosticoPrincipal = estudante.diagnosticos.length > 0 
      ? estudante.diagnosticos[0].diagnostico.tipo 
      : 'Sem Laudo';

    // Cria o pacote para o modal
    const dadosParaModal: AlunoModalData = {
      id: estudante.id,
      nome: estudante.nomeCompleto,
      turma: nomeDaTurma,
      diagnostico: diagnosticoPrincipal,
      nivelSuporte: 'Nível 1 de Suporte', // Opcional: Se não vier do banco, fixamos um para o design
      foto: estudante.foto || `https://ui-avatars.com/api/?name=${estudante.nomeCompleto}&background=F0E6FF&color=4A148C`
    };

    this.alunoEmDestaque.set(dadosParaModal);
  }

  // Calcula a idade com base na data de nascimento 
calcularIdade(dataNascimento: string | Date | undefined): number | undefined {    
  if (!dataNascimento) return undefined;
    
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    // Se o mês atual for anterior ao mês de nascimento, ou se for o mesmo mês mas o dia ainda não chegou, diminui 1 ano
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade;
  }
}
