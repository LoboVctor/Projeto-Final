import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import type { ITurmaRepositorio, MetricasTurma } from './interfaces/ITurmaRepositorio.js';

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

    const idadeMedia = idades.length > 0
      ? Math.round(idades.reduce((acc, i) => acc + i, 0) / idades.length * 10) / 10
      : null;

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
      idadeMedia,
      diagnosticoPrincipal,
      comunicacaoPrincipal,
      distribuicaoSexo,
      distribuicaoIdade,
      distribuicaoDiagnostico,
      distribuicaoComunicacao,
    };
  }
}
