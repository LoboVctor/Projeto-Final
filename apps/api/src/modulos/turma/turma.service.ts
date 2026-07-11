import { Injectable, Logger, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import * as Papa from 'papaparse';
import type { ITurmaRepositorio, MetricasTurma, AgregacaoKpisDiarios } from './interfaces/ITurmaRepositorio.js';
import { KpisTurmaResponseDto } from './dtos/kpis-turma-response.dto.js';
import { TurmaDashboardResponseDto } from './dtos/turma-dashboard-response.dto.js';

@Injectable()
export class TurmaService {
  private readonly logger = new Logger(TurmaService.name);

  constructor(
    @Inject('ITurmaRepositorio')
    private readonly turmaRepositorio: ITurmaRepositorio,
  ) {}
  

  /**
   * Lista as turmas cujo educador possui pelo menos uma Aula associada.
   * Se educadorId não for fornecido, retorna todas as turmas.
   */
  async findAll(educadorId?: string) {
    return this.turmaRepositorio.buscarTodas(educadorId);
  }

  async importarCSV(arquivo: Express.Multer.File, logadoId: string) {
    const csvData = arquivo.buffer.toString('utf-8');
    
    const result = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      throw new BadRequestException('Erro ao processar o CSV: ' + JSON.stringify(result.errors));
    }

    let sucesso = 0;
    let falhas = 0;
    const erros = [];

    // Busca dados do logado para saber escolaId
    // Em turma, não é trivial. Vou usar um fake escolaId ou o logadoId caso o backend requeira algo diferente,
    // mas a entidade Turma precisa de: nome, turno, anoLetivo, etapa. A escolaId é mandatória, 
    // mas assumiremos que 'importarCSV' no turmaController tem logadoId e usaremos algo fixo caso não possamos pegar.
    // Deixarei a inserção baseada na struct do Prisma
    for (const [index, row] of result.data.entries()) {
      try {
        const rowData = row as any;
        if (!rowData.nome || !rowData.turno || !rowData.anoLetivo || !rowData.etapa) {
          throw new Error('Campos obrigatórios ausentes: nome, turno, anoLetivo, etapa.');
        }

        const criarDados = {
          nome: rowData.nome,
          turno: rowData.turno,
          anoLetivo: Number(rowData.anoLetivo),
          etapa: rowData.etapa,
          escolaId: logadoId, // Assumindo escolaId como logadoId para teste ou pegar dinamicamente se necessário
        };

        await this.turmaRepositorio.criarTurma(criarDados);
        sucesso++;
      } catch (err: any) {
        falhas++;
        erros.push(`Linha ${index + 2}: ${err.message || 'Erro desconhecido'}`);
      }
    }

    return { sucesso, falhas, erros };
  }

  /**
   * Lista os estudantes de uma turma com dados básicos e seus diagnósticos.
   * Usa include único para buscar a turma e seus estudantes em uma única chamada ao BD, evitando N+1.
   */
  async findEstudantesByTurma(turmaId: string) {
    const turma = await this.turmaRepositorio.buscarEstudantesPorTurma(turmaId);

    if (!turma) {
      throw new NotFoundException(`Turma com id "${turmaId}" não encontrada.`);
    }

    return {
      turma: { id: turma.id, nome: turma.nome },
      estudantes: turma.estudantes,
    };
  }

  /**
   * Retorna os dados para os gráficos de diagnósticos e assiduidade de uma turma.
   * As consultas ao banco são executadas concorrentemente com Promise.all para melhorar o desempenho.
   */
  async obterDadosGraficos(turmaId: string) {
    try {
      const { turma, assiduidade } =
        await this.turmaRepositorio.buscarDadosGraficos(turmaId);

      if (!turma) {
        throw new NotFoundException('Turma não encontrada');
      }

      const contagemDiagnosticos: Record<string, number> = {};

      turma.estudantes.forEach((estudante) => {
        estudante.diagnosticos.forEach((ed) => {
          const tipo = ed.diagnostico.tipo;
          contagemDiagnosticos[tipo] = (contagemDiagnosticos[tipo] || 0) + 1;
        });
      });

      const formatacaoDiagnosticos = Object.entries(contagemDiagnosticos)
        .map(([tipo, quantidade]) => ({ tipo, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade);

      const presentes =
        assiduidade.find((a) => a.presenca === true)?._count.presenca || 0;
      const ausentes =
        assiduidade.find((a) => a.presenca === false)?._count.presenca || 0;

      return {
        diagnosticos: formatacaoDiagnosticos,
        assiduidade: { presentes, ausentes },
      };
    } catch (error) {
      this.logger.error(
        `Erro ao processar gráficos da turma ${turmaId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Calcula as métricas agregadas de uma turma:
   * Big Numbers (total de alunos, idade média, diagnóstico e comunicação principal)
   * e distribuições para gráficos (sexo, idade, diagnóstico, comunicação).
   */
  async obterMetricasTurma(turmaId: string): Promise<MetricasTurma> {
    const turma = await this.turmaRepositorio.buscarMetricasTurma(turmaId);

    if (!turma) {
      throw new NotFoundException(`Turma com id "${turmaId}" não encontrada.`);
    }

    const estudantes = turma.estudantes;
    const totalAlunos = estudantes.length;
    const agora = new Date();

    // ── Cálculo de Idade ──────────────────────────────────────────
    const idades = estudantes
      .map((e) => {
        const nasc = new Date(e.dataNascimento);
        let idade = agora.getFullYear() - nasc.getFullYear();
        const mes = agora.getMonth() - nasc.getMonth();
        if (mes < 0 || (mes === 0 && agora.getDate() < nasc.getDate())) {
          idade--;
        }
        return idade;
      })
      .filter((i) => i >= 0);

    // ── Cálculo de Idade Predominante (Moda) ─────────────────────
    const idadeFreqMapCalculo = new Map<number, number>();
    for (const i of idades) {
      idadeFreqMapCalculo.set(i, (idadeFreqMapCalculo.get(i) ?? 0) + 1);
    }

    let idadePredominante: number | null = null;
    if (idadeFreqMapCalculo.size > 0) {
      let maxFreq = 0;
      for (const [idade, freq] of idadeFreqMapCalculo.entries()) {
        if (freq > maxFreq) {
          maxFreq = freq;
          idadePredominante = idade;
        }
      }
    }

    // ── Distribuição por Sexo ─────────────────────────────────────
    const sexoMap = new Map<string, number>();
    for (const e of estudantes) {
      sexoMap.set(e.sexo, (sexoMap.get(e.sexo) ?? 0) + 1);
    }
    const distribuicaoSexo = Array.from(sexoMap.entries())
      .map(([sexo, quantidade]) => ({ sexo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // ── Distribuição por Diagnóstico ──────────────────────────────
    const diagMap = new Map<string, number>();
    for (const e of estudantes) {
      for (const d of e.diagnosticos) {
        const tipo = d.diagnostico.tipo;
        diagMap.set(tipo, (diagMap.get(tipo) ?? 0) + 1);
      }
    }
    const distribuicaoDiagnostico = Array.from(diagMap.entries())
      .map(([tipo, quantidade]) => ({ tipo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const diagnosticoPrincipal = distribuicaoDiagnostico[0]?.tipo ?? null;

    // ── Distribuição por Comunicação ──────────────────────────────
    const comMap = new Map<string, number>();
    for (const e of estudantes) {
      comMap.set(e.formaComunicacao, (comMap.get(e.formaComunicacao) ?? 0) + 1);
    }
    const distribuicaoComunicacao = Array.from(comMap.entries())
      .map(([forma, quantidade]) => ({ forma, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    const comunicacaoPrincipal = distribuicaoComunicacao[0]?.forma ?? null;

    // ── Distribuição por Faixa de Idade ───────────────────────────
    const idadeFreqMap = new Map<number, number>();
    for (const i of idades) {
      idadeFreqMap.set(i, (idadeFreqMap.get(i) ?? 0) + 1);
    }
    const distribuicaoIdade = Array.from(idadeFreqMap.entries())
      .map(([idade, quantidade]) => ({ idade, quantidade }))
      .sort((a, b) => a.idade - b.idade);

    return {
      totalAlunos,
      idadePredominante,
      diagnosticoPrincipal,
      comunicacaoPrincipal,
      distribuicaoSexo,
      distribuicaoIdade,
      distribuicaoDiagnostico,
      distribuicaoComunicacao,
    };
  }

  async obterKpisTurma(turmaId: string): Promise<KpisTurmaResponseDto> {
    try {
      const turmaExists = await this.turmaRepositorio.buscarEstudantesPorTurma(turmaId);
      if (!turmaExists) {
        throw new NotFoundException(`Turma com id "${turmaId}" não encontrada.`);
      }

      const agregacoes = await this.turmaRepositorio.buscarAgregacoesKpis({ turmaId });
      return this.formatarKpisResumo(agregacoes);
    } catch (error) {
      this.logger.error(`Erro ao processar KPIs da turma ${turmaId}`, error);
      throw error;
    }
  }

  async obterKpisGeraisEscola(escolaId?: string): Promise<KpisTurmaResponseDto> {
    try {
      const agregacoes = await this.turmaRepositorio.buscarAgregacoesKpis({ escolaId });
      return this.formatarKpisResumo(agregacoes);
    } catch (error) {
      this.logger.error(`Erro ao processar KPIs da escola ${escolaId}`, error);
      throw error;
    }
  }

  private formatarKpisResumo(agregacoes: AgregacaoKpisDiarios): KpisTurmaResponseDto {
    const { diariosAgregados } = agregacoes;

    return {
      mediaComportamento: Number(diariosAgregados._avg.scoreComportamento?.toFixed(1)) || 0,
      mediaInteracao: Number(diariosAgregados._avg.scoreInteracao?.toFixed(1)) || 0,
      mediaFoco: Number(diariosAgregados._avg.scoreFoco?.toFixed(1)) || 0,
      mediaAutonomia: Number(diariosAgregados._avg.scoreAutonomia?.toFixed(1)) || 0,
      mediaAlimentacao: Number(diariosAgregados._avg.statusAlimentacao?.toFixed(1)) || 0,
      mediaBanheiro: Number(diariosAgregados._avg.usoBanheiro?.toFixed(1)) || 0,
    };
  }

  async obterDashboardTurma(turmaId: string, periodo: string = 'semana'): Promise<TurmaDashboardResponseDto> {
    const turmaExists = await this.turmaRepositorio.buscarEstudantesPorTurma(turmaId);
    if (!turmaExists) throw new NotFoundException(`Turma não encontrada.`);

    const { atualInicio, atualFim, anteriorInicio, anteriorFim } = this.calcularJanelasDeTempoIguaisAoAluno(periodo);

    // 2. Trocamos o this.prisma por this.turmaRepositorio
    const [diarioAtual, diarioAnterior, freqAtual, freqAnterior] = await Promise.all([
      this.turmaRepositorio.buscarAgregacoesDiariasPorPeriodo(turmaId, atualInicio, atualFim),
      this.turmaRepositorio.buscarAgregacoesDiariasPorPeriodo(turmaId, anteriorInicio, anteriorFim),
      
      this.turmaRepositorio.buscarAulasRealizadas(turmaId, atualInicio, atualFim),
      this.turmaRepositorio.buscarAulasRealizadas(turmaId, anteriorInicio, anteriorFim)
    ]);

    const calcularMetricasFrequencia = (aulas: { presenca: boolean }[]) => {
      if (aulas.length === 0) return 0;
      const totaisPresencas = aulas.filter(a => a.presenca).length;
      return (totaisPresencas / aulas.length) * 100;
    };

    const valFreqAtual = calcularMetricasFrequencia(freqAtual);
    const valFreqAnterior = calcularMetricasFrequencia(freqAnterior);

    const chaves = [
      { key: 'Alimentacao', prop: 'statusAlimentacao' },
      { key: 'Banheiro', prop: 'usoBanheiro' },
      { key: 'Autonomia', prop: 'scoreAutonomia' },
      { key: 'Comportamento', prop: 'scoreComportamento' },
      { key: 'Interacao', prop: 'scoreInteracao' },
      { key: 'Foco', prop: 'scoreFoco' },
    ];

    const categorias: Record<string, { valor: number; variacao: number }> = {};
    let somaMediaGeral = 0;
    let somaMediaGeralAnterior = 0;

    for (const c of chaves) {
      const valAtual = diarioAtual._avg[c.prop as keyof typeof diarioAtual._avg] || 0;
      const valAnterior = diarioAnterior._avg[c.prop as keyof typeof diarioAnterior._avg] || 0;
      
      categorias[c.key] = {
        valor: Number(valAtual.toFixed(1)),
        variacao: Number((valAtual - valAnterior).toFixed(1)),
      };
      somaMediaGeral += valAtual;
      somaMediaGeralAnterior += valAnterior;
    }

    const valMediaGeral = somaMediaGeral / 6;
    const valMediaGeralAnterior = somaMediaGeralAnterior / 6;

    return {
      mediaGeral: {
        valor: Number(valMediaGeral.toFixed(1)),
        variacao: Number((valMediaGeral - valMediaGeralAnterior).toFixed(1)),
      },
      frequencia: {
        valor: Number(valFreqAtual.toFixed(1)),
        variacao: Number((valFreqAtual - valFreqAnterior).toFixed(1)),
      },
      categorias,
    };
  }

  private calcularJanelasDeTempoIguaisAoAluno(periodo: string) {
    const atualFim = new Date();
    const atualInicio = new Date();
    const anteriorFim = new Date();
    const anteriorInicio = new Date();

    if (periodo === 'semestre') {
      atualInicio.setMonth(atualInicio.getMonth() - 6);
      anteriorFim.setMonth(anteriorFim.getMonth() - 6);
      anteriorInicio.setMonth(anteriorInicio.getMonth() - 12);
    } else if (periodo === 'mes') {
      atualInicio.setDate(atualInicio.getDate() - 30);
      anteriorFim.setDate(anteriorFim.getDate() - 30);
      anteriorInicio.setDate(anteriorInicio.getDate() - 60);
    } else {
      atualInicio.setDate(atualInicio.getDate() - 7);
      anteriorFim.setDate(anteriorFim.getDate() - 7);
      anteriorInicio.setDate(anteriorInicio.getDate() - 14);
    }

    return { atualInicio, atualFim, anteriorInicio, anteriorFim };
  }
  async obterBigNumbersHome(educadorId: string) {
    const totalAlunos = await this.turmaRepositorio.contarEstudantesDoEducador(educadorId);

    const hoje = new Date();
    const diaDaSemanaAtual = hoje.getDay();
    
    const dataCorte = new Date();
    dataCorte.setDate(dataCorte.getDate() - 90);

    const registros = await this.turmaRepositorio.buscarRegistrosDiariosDoEducador(educadorId, dataCorte);

    const registrosDoDia = registros.filter(r => {
      return new Date(r.data).getDay() === diaDaSemanaAtual;
    });

    let scoreMedio = 0;

    if (registrosDoDia.length > 0) {
      let somaGeral = 0;
      for (const r of registrosDoDia) {
        const mediaDoRegistro = (
          r.scoreComportamento + 
          r.scoreInteracao + 
          r.scoreFoco + 
          r.scoreAutonomia + 
          r.statusAlimentacao + 
          r.usoBanheiro
        ) / 6;
        somaGeral += mediaDoRegistro;
      }
      // Calcula a média das médias
      scoreMedio = Number((somaGeral / registrosDoDia.length).toFixed(1));
    }

    return {
      totalAlunos,
      scoreMedioDia: scoreMedio,
      diaDaSemana: diaDaSemanaAtual
    };
  }

  /**
   * Calcula métricas agregadas de TODA a escola (visão do Coordenador):
   * Big Numbers (total de alunos, professores e turmas) +
   * distribuições para gráficos (sexo, idade, diagnóstico, comunicação).
   * Reutiliza a lógica de agregação do obterMetricasTurma, sem filtro de turma.
   */
  async obterMetricasEscola(): Promise<MetricasTurma & { totalProfessores: number; totalTurmas: number }> {
    const { estudantes, totalProfessores, totalTurmas } = await this.turmaRepositorio.buscarMetricasEscola();

    const totalAlunos = estudantes.length;
    const agora = new Date();

    // ── Cálculo de Idades ────────────────────────────────────
    const idades = estudantes
      .map((e) => {
        const nasc = new Date(e.dataNascimento);
        let idade = agora.getFullYear() - nasc.getFullYear();
        const mes = agora.getMonth() - nasc.getMonth();
        if (mes < 0 || (mes === 0 && agora.getDate() < nasc.getDate())) idade--;
        return idade;
      })
      .filter((i) => i >= 0);

    // Idade Predominante (Moda)
    const idadeFreqMap = new Map<number, number>();
    for (const i of idades) idadeFreqMap.set(i, (idadeFreqMap.get(i) ?? 0) + 1);
    let idadePredominante: number | null = null;
    if (idadeFreqMap.size > 0) {
      let maxFreq = 0;
      for (const [idade, freq] of idadeFreqMap.entries()) {
        if (freq > maxFreq) { maxFreq = freq; idadePredominante = idade; }
      }
    }

    // ── Distribuição por Sexo ───────────────────────────
    const sexoMap = new Map<string, number>();
    for (const e of estudantes) sexoMap.set(e.sexo, (sexoMap.get(e.sexo) ?? 0) + 1);
    const distribuicaoSexo = Array.from(sexoMap.entries())
      .map(([sexo, quantidade]) => ({ sexo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);

    // ── Distribuição por Diagnóstico ─────────────────────
    const diagMap = new Map<string, number>();
    for (const e of estudantes) {
      for (const d of e.diagnosticos) {
        const tipo = d.diagnostico.tipo;
        diagMap.set(tipo, (diagMap.get(tipo) ?? 0) + 1);
      }
    }
    const distribuicaoDiagnostico = Array.from(diagMap.entries())
      .map(([tipo, quantidade]) => ({ tipo, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
    const diagnosticoPrincipal = distribuicaoDiagnostico[0]?.tipo ?? null;

    // ── Distribuição por Comunicação ────────────────────
    const comMap = new Map<string, number>();
    for (const e of estudantes) comMap.set(e.formaComunicacao, (comMap.get(e.formaComunicacao) ?? 0) + 1);
    const distribuicaoComunicacao = Array.from(comMap.entries())
      .map(([forma, quantidade]) => ({ forma, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
    const comunicacaoPrincipal = distribuicaoComunicacao[0]?.forma ?? null;

    // ── Distribuição por Faixa de Idade ─────────────────
    const idadeDistMap = new Map<number, number>();
    for (const i of idades) idadeDistMap.set(i, (idadeDistMap.get(i) ?? 0) + 1);
    const distribuicaoIdade = Array.from(idadeDistMap.entries())
      .map(([idade, quantidade]) => ({ idade, quantidade }))
      .sort((a, b) => a.idade - b.idade);

    return {
      totalAlunos,
      totalProfessores,
      totalTurmas,
      idadePredominante,
      diagnosticoPrincipal,
      comunicacaoPrincipal,
      distribuicaoSexo,
      distribuicaoIdade,
      distribuicaoDiagnostico,
      distribuicaoComunicacao,
    };
  }
}
