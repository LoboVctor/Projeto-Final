import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TurmasService,
  TurmaResumo,
  EstudanteResumo,
  EstudantesPorTurmaResponse,
  MetricasTurma,
} from '../../../nucleo/services/turmas.service';
import { AuthService } from '../../../nucleo/services/auth';
import { DiagLabelPipe, DiagColorPipe } from '../../../compartilhado/pipes/student.pipes';
import { CardAlunoComponent } from '../../../compartilhado/components/card-aluno/card-aluno';
import { AlunoModalData } from '../../../compartilhado/models/aluno-modal.model';
import { AlunoModalComponent } from '../../../compartilhado/components/aluno-modal/aluno-modal.component';
import { TurmaGraficosComponent } from '../../turma/components/turma-graficos/turma-graficos';
import { KpisTurmaComponent } from '../../turma/components/kpis-turma/kpis-turma.component';
import { LoadingFlorComponent } from '../../../compartilhado/components/loading-flor/loading-flor.component';
import { AuditoriaService } from '../../../nucleo/services/auditoria.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../../nucleo/config/api.config';
import { finalize } from 'rxjs';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { buildAlunoModalData, getDiagnosticosArrayForCard, buildFotoUrl } from '../../../compartilhado/utils/aluno-modal.utils';

type ViewMode = 'grid' | 'list';

const DIAG_LABEL: Record<string, string> = {
  TEA: 'TEA', TDAH: 'TDAH', SINDROME_DOWN: 'S.DOWN',
  PARALISIA_CEREBRAL: 'PC', DEFICIENCIA_INTELECTUAL: 'DI',
  DEFICIENCIA_MULTIPLA: 'DEMU', OUTRO: 'OUTRO',
};

/** Labels amigáveis para sexo */
const SEXO_LABEL: Record<string, string> = {
  MASCULINO: 'Masculino',
  FEMININO: 'Feminino',
  OUTRO: 'Outro',
};

const FCOM_LABEL: Record<string, string> = { VERBAL: 'Verbal', NAO_VERBAL: 'Não Verbal' };

@Component({
  selector: 'app-coordenador-turmas',
  imports: [CommonModule, CardAlunoComponent, DiagLabelPipe, DiagColorPipe, AlunoModalComponent, TurmaGraficosComponent, KpisTurmaComponent, LoadingFlorComponent],
  templateUrl: './coordenador-turmas.component.html',
  styleUrls: ['./coordenador-turmas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordenadorTurmasComponent implements OnInit {
  private readonly turmasService = inject(TurmasService);
  private readonly authService = inject(AuthService);
  private readonly auditoriaService = inject(AuditoriaService);

  @ViewChild('relatorioTurma') relatorioTurma!: ElementRef;

  turmas = signal<TurmaResumo[]>([]);
  estudantes = signal<EstudanteResumo[]>([]);
  turmaSelecionada = signal<TurmaResumo | null>(null);
  metricas = signal<MetricasTurma | null>(null);
  viewMode = signal<ViewMode>('grid');
  loading = signal(false);
  loadingEstudantes = signal(false);
  error = signal<string | null>(null);
  alunoEmDestaque = signal<AlunoModalData | null>(null);
  abaAtiva = signal<'perfil' | 'kpis'>('perfil');
  loadingAba = signal(false);

  // ── Signals de exportação ──
  exportDropdownAberto = signal(false);
  gerandoPdf = signal(false);
  nomeUsuarioLogado = signal<string>('');
  dataHoraAtual = signal<Date>(new Date());

  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  
  isImporting = signal(false);
  importResult = signal<{ sucesso: number; falhas: number; erros: string[] } | null>(null);

  trocarAba(aba: 'perfil' | 'kpis'): void {
    if (this.abaAtiva() === aba) return;
    this.loadingAba.set(true);
    // Simula um tempo de carregamento suave
    setTimeout(() => {
      this.abaAtiva.set(aba);
      this.loadingAba.set(false);
      
      if (aba === 'kpis') {
        setTimeout(() => {
          const sidebar = document.querySelector('.sidebar-wrapper');
          if (sidebar) {
            sidebar.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 50);
      }
    }, 400);
  }

  readonly diagnosticoPrincipalLabel = computed(() => {
    const d = this.metricas()?.diagnosticoPrincipal;
    return d ? (DIAG_LABEL[d] ?? d) : '—';
  });

  readonly comunicacaoPrincipalLabel = computed(() => {
    const c = this.metricas()?.comunicacaoPrincipal;
    return c ? (FCOM_LABEL[c] ?? c) : '—';
  });

  ngOnInit(): void {
    this.carregarTurmas();
    this.nomeUsuarioLogado.set(this.authService.getLoggedUserName());
  }

  carregarTurmas(): void {
    this.loading.set(true);
    // Coordenador vê TODAS as turmas (sem filtro por educadorId)
    this.turmasService.getTurmas().subscribe({
      next: (turmas) => {
        this.turmas.set(turmas);
        this.loading.set(false);
        if (turmas.length > 0 && turmas[0]) this.selecionarTurma(turmas[0]);
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
    this.loadingEstudantes.set(true);

    this.turmasService.getEstudantesDaTurma(turma.id).subscribe({
      next: (res: EstudantesPorTurmaResponse) => {
        this.estudantes.set(res.estudantes);
        this.loadingEstudantes.set(false);
      },
      error: () => {
        this.error.set('Erro ao carregar estudantes.');
        this.loadingEstudantes.set(false);
      },
    });

    this.turmasService.obterMetricasTurma(turma.id).subscribe({
      next: (m) => this.metricas.set(m),
      error: () => this.metricas.set(null),
    });
  }

  setView(mode: ViewMode): void { this.viewMode.set(mode); }

  onTurmaSelecionadaChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = select.value;
    const turma = this.turmas().find(t => t.id === id);
    if (turma) {
      this.selecionarTurma(turma);
    }
  }

  abrirDetalhesAluno(estudante: EstudanteResumo): void {
    this.alunoEmDestaque.set(buildAlunoModalData(estudante, this.baseUrl));
  }

  getDiagnosticosCard(estudante: EstudanteResumo): string[] {
    return getDiagnosticosArrayForCard(estudante.diagnosticos);
  }

  getFotoUrlCard(estudante: EstudanteResumo): string {
    return buildFotoUrl(estudante.nomeCompleto, estudante.foto, this.baseUrl);
  }

  fecharModalAluno(houveModificacao: boolean = false): void {
    this.alunoEmDestaque.set(null);
    if (houveModificacao) {
      const turma = this.turmaSelecionada();
      if (turma) {
        this.selecionarTurma(turma);
      }
    }
  }

  /** Exibe apenas primeiro nome + último sobrenome (igual ao padrão da tela de turmas do professor) */
  nomeCurtoAluno(nomeCompleto: string): string {
    if (!nomeCompleto) return '';
    const partes = nomeCompleto.trim().split(/\s+/);
    if (partes.length <= 2) return nomeCompleto;
    return `${partes[0]} ${partes[partes.length - 1]}`;
  }

  abrirModalCadastrarTurma(): void {
    alert('Funcionalidade de cadastro de turma em desenvolvimento.');
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.importarCSVTurmas(file);
    }
    (event.target as HTMLInputElement).value = '';
  }

  importarCSVTurmas(arquivo: File) {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    this.isImporting.set(true);
    this.importResult.set(null);

    this.http.post<any>(`${this.baseUrl}/turmas/importar-csv`, formData)
      .pipe(finalize(() => this.isImporting.set(false)))
      .subscribe({
        next: (res) => {
          this.importResult.set({
            sucesso: res.sucesso || 0,
            falhas: res.falhas || 0,
            erros: res.erros || []
          });
          this.carregarTurmas();
        },
        error: (err) => {
          alert('Erro ao importar CSV: ' + (err.error?.message || err.message));
        }
      });
  }

  fecharModalImport() {
    this.importResult.set(null);
  }

  // ── Lógica de exportação (baseada no padrão do BlocoDashboardComponent) ──

  toggleExportDropdown(): void {
    this.exportDropdownAberto.update(v => !v);
  }

  exportarCSV(): void {
    this.exportDropdownAberto.set(false);
    const turma = this.turmaSelecionada();
    const m = this.metricas();
    if (!turma) return;

    this.dataHoraAtual.set(new Date());
    const dataAtual = this.dataHoraAtual().toLocaleDateString('pt-BR');
    const horaAtual = this.dataHoraAtual().toLocaleTimeString('pt-BR');

    let csv = '\ufeff';
    csv += `RELATÓRIO DE PERFIL DA TURMA\n`;
    csv += `Turma:;${turma.nome}\n`;
    csv += `Ano Letivo:;${turma.anoLetivo}\n`;
    csv += `Turno:;${turma.turno}\n`;
    csv += `Data de Geração:;${dataAtual} às ${horaAtual}\n`;
    csv += `Gerado por:;${this.nomeUsuarioLogado()}\n\n`;

    if (m) {
      csv += `RESUMO GERAL\n`;
      csv += `Métrica;Valor\n`;
      csv += `Total de Alunos;${m.totalAlunos}\n`;
      csv += `Idade Predominante;${m.idadePredominante !== null ? m.idadePredominante + ' anos' : '—'}\n`;
      csv += `Diagnóstico Principal;${m.diagnosticoPrincipal ? (DIAG_LABEL[m.diagnosticoPrincipal] ?? m.diagnosticoPrincipal) : '—'}\n`;
      csv += `Comunicação Principal;${m.comunicacaoPrincipal ? (FCOM_LABEL[m.comunicacaoPrincipal] ?? m.comunicacaoPrincipal) : '—'}\n\n`;

      csv += `DISTRIBUIÇÃO POR SEXO\n`;
      csv += `Sexo;Quantidade\n`;
      m.distribuicaoSexo.forEach(d => {
        csv += `${SEXO_LABEL[d.sexo] ?? d.sexo};${d.quantidade}\n`;
      });
      csv += '\n';

      csv += `DISTRIBUIÇÃO POR IDADE\n`;
      csv += `Idade;Quantidade de Alunos\n`;
      m.distribuicaoIdade.forEach(d => {
        csv += `${d.idade} anos;${d.quantidade}\n`;
      });
      csv += '\n';

      csv += `DISTRIBUIÇÃO POR DIAGNÓSTICO\n`;
      csv += `Diagnóstico;Quantidade de Alunos\n`;
      m.distribuicaoDiagnostico.forEach(d => {
        csv += `${DIAG_LABEL[d.tipo] ?? d.tipo};${d.quantidade}\n`;
      });
      csv += '\n';

      csv += `DISTRIBUIÇÃO POR FORMA DE COMUNICAÇÃO\n`;
      csv += `Forma de Comunicação;Quantidade de Alunos\n`;
      m.distribuicaoComunicacao.forEach(d => {
        csv += `${FCOM_LABEL[d.forma] ?? d.forma};${d.quantidade}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `perfil_turma_${turma.nome.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.auditoriaService.registrarDownload('TURMA_METRICAS', 'CSV', `turma_id=${turma.id}`).subscribe();
  }

  async exportarPDF(): Promise<void> {
    this.exportDropdownAberto.set(false);
    this.dataHoraAtual.set(new Date());
    this.gerandoPdf.set(true);

    // Aguarda o overlay de carregamento aparecer e os gráficos estabilizarem
    await new Promise(resolve => setTimeout(resolve, 300));

    const elemento = this.relatorioTurma.nativeElement as HTMLElement;
    const cabecalhoPdf = document.getElementById('cabecalho-relatorio-turma-pdf');
    const botoesEsconder = elemento.querySelectorAll('.esconder-no-pdf');

    // Mostra o cabeçalho de impressão e esconde botões interativos
    if (cabecalhoPdf) cabecalhoPdf.classList.remove('hidden');
    botoesEsconder.forEach(el => (el as HTMLElement).style.display = 'none');

    // ── Fix: Canvas em branco — mesmo padrão do BlocoDashboardComponent ──
    const canvasList = Array.from(elemento.querySelectorAll('canvas')) as HTMLCanvasElement[];
    const overlays: { canvas: HTMLCanvasElement; img: HTMLImageElement }[] = [];

    for (const canvas of canvasList) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.position = 'absolute';
        img.style.top = canvas.offsetTop + 'px';
        img.style.left = canvas.offsetLeft + 'px';
        img.style.width = canvas.offsetWidth + 'px';
        img.style.height = canvas.offsetHeight + 'px';
        img.style.pointerEvents = 'none';
        canvas.parentElement?.appendChild(img);
        canvas.style.opacity = '0';
        overlays.push({ canvas, img });
      } catch { /* tainted canvas — skip */ }
    }

    // ── Fix: Altura cortada pelo overflow-y: auto ──
    const estiloOriginalOverflow = elemento.style.overflow;
    const estiloOriginalMaxH = elemento.style.maxHeight;
    elemento.style.overflow = 'visible';
    elemento.style.maxHeight = 'none';

    try {
      const imgData = await toPng(elemento, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: elemento.scrollWidth,
        height: elemento.scrollHeight,
        style: { overflow: 'visible', maxHeight: 'none' },
      });

      const larguraPDF = new jsPDF('p', 'mm', 'a4').internal.pageSize.getWidth();
      const alturaPDF = (elemento.scrollHeight * larguraPDF) / elemento.scrollWidth;

      const pdfDinamico = new jsPDF('p', 'mm', [larguraPDF, alturaPDF]);
      pdfDinamico.addImage(imgData, 'PNG', 0, 0, larguraPDF, alturaPDF);

      const turma = this.turmaSelecionada();
      const nomePdf = turma ? `Relatorio_Turma_${turma.nome.replace(/\s+/g, '_')}.pdf` : 'Relatorio_Turma.pdf';
      pdfDinamico.save(nomePdf);
      this.auditoriaService.registrarDownload('RELATORIO_TURMA', 'PDF', this.buildDetalhes()).subscribe();

    } catch (erro) {
      console.error('Erro ao gerar PDF da turma:', erro);
      alert('Não foi possível gerar o PDF no momento.');
    } finally {
      // Restaura o DOM independentemente de sucesso ou falha
      for (const { canvas, img } of overlays) {
        canvas.style.opacity = '';
        img.remove();
      }
      elemento.style.overflow = estiloOriginalOverflow;
      elemento.style.maxHeight = estiloOriginalMaxH;

      if (cabecalhoPdf) cabecalhoPdf.classList.add('hidden');
      botoesEsconder.forEach(el => (el as HTMLElement).style.display = '');
      this.gerandoPdf.set(false);
    }
  }

  /** Constrói a string de detalhes para a trilha de auditoria, incluindo o nome da turma */
  private buildDetalhes(): string {
    const turma = this.turmaSelecionada();
    return `turmaId=${turma?.id ?? ''}; nomeTurma=${turma?.nome ?? ''}; aba=${this.abaAtiva()}`;
  }
}
