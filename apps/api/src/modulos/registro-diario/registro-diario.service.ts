import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import type { IRegistroDiarioRepositorio } from './interfaces/IRegistroDiarioRepositorio.js';
import { CreateRegistrosDiarioDto } from './dtos/create-registros-diario.dto.js';
import { UpdateRegistrosDiarioDto } from './dtos/update-registros-diario.dto.js';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StatusAula } from '../../../../../infra/generated/prisma/index.js';

@Injectable()
export class RegistroDiarioService {
  private readonly logger = new Logger(RegistroDiarioService.name);

  constructor(
    @Inject('IRegistroDiarioRepositorio')
    private readonly registroDiarioRepositorio: IRegistroDiarioRepositorio,
    private readonly prisma: PrismaService
  ) {}

  async create(dto: CreateRegistrosDiarioDto) {
    const dataSegura = dto.data
      ? this.parseDateOnlyToSafeDate(dto.data)
      : new Date();

    return this.registroDiarioRepositorio.criar({
      estudanteId: dto.estudanteId,
      educadorId: dto.educadorId,
      data: dataSegura,
      preenchido: dto.preenchido ?? true,
      scoreComportamento: dto.scoreComportamento,
      scoreInteracao: dto.scoreInteracao,
      scoreFoco: dto.scoreFoco,
      scoreAutonomia: dto.scoreAutonomia,
      statusAlimentacao: dto.statusAlimentacao,
      usoBanheiro: dto.usoBanheiro,
      anotacoes: dto.anotacoes,
    });
  }

  async findAll() {
    return this.registroDiarioRepositorio.buscarTodos();
  }

  async findAlertasDiasAnteriores(educadorId: string) {
    return this.registroDiarioRepositorio.buscarAlertasDiasAnteriores(
      educadorId,
    );
  }

  async getResumoMensal(educadorId: string) {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
    const dataFimOntem = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() - 1, 23, 59, 59, 999));
    const dataLimiteSuperior = dataFimOntem < primeiroDiaDoMes ? primeiroDiaDoMes : dataFimOntem;
    
    const [totalPreenchidos, totalEsperado] = await Promise.all([
      this.registroDiarioRepositorio.contarRegistrosPreenchidos(
        educadorId,
        primeiroDiaDoMes,
        dataLimiteSuperior,
      ),
      this.registroDiarioRepositorio.contarRegistrosEsperados(
        educadorId,
        primeiroDiaDoMes,
        dataLimiteSuperior,
      ),
    ]);

    return { totalEsperado, totalPreenchidos };
  }

  async findOne(id: string) {
    const registro = await this.registroDiarioRepositorio.buscarPorId(id);

    if (!registro)
      throw new NotFoundException(
        `Registo diário com ID ${id} não encontrado.`,
      );
    return registro;
  }

  async update(id: string, dto: UpdateRegistrosDiarioDto) {
    await this.findOne(id);
    const dadosAtualizados = { ...dto, preenchido: true };

    return this.registroDiarioRepositorio.atualizar(id, dadosAtualizados);
  }

  private parseDateOnlyToSafeDate(dateString?: string): Date {
    if (!dateString) return new Date();
    if (dateString.includes('T')) {
      dateString = dateString.split('T')[0]!;
    }
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year!, month! - 1, day, 12, 0, 0));
  }

  async getSemana(estudanteId: string, dataBaseStr: string) {
    const dataBase = this.parseDateOnlyToSafeDate(dataBaseStr);

    const diaDaSemana = dataBase.getUTCDay();
    const domingo = new Date(dataBase);
    domingo.setUTCDate(dataBase.getUTCDate() - diaDaSemana);
    domingo.setUTCHours(0, 0, 0, 0);

    const sabado = new Date(domingo);
    sabado.setUTCDate(domingo.getUTCDate() + 6);
    sabado.setUTCHours(23, 59, 59, 999);

    const registros = await this.registroDiarioRepositorio.buscarPorPeriodo(
      estudanteId,
      domingo,
      sabado,
    );

    const semana = [];
    for (let i = 0; i < 7; i++) {
      const dataAtual = new Date(domingo);
      dataAtual.setUTCDate(domingo.getUTCDate() + i);
      dataAtual.setUTCHours(12, 0, 0, 0);

      const registroDoDia = registros.find((r) => {
        const d = new Date(r.data);
        return (
          d.getUTCDate() === dataAtual.getUTCDate() &&
          d.getUTCMonth() === dataAtual.getUTCMonth() &&
          d.getUTCFullYear() === dataAtual.getUTCFullYear()
        );
      });

      semana.push({
        data: dataAtual,
        registro: registroDoDia || null,
      });
    }

    return semana;
  }

  async upsertRegistro(dto: CreateRegistrosDiarioDto) {
    const dataOperacao = this.parseDateOnlyToSafeDate(dto.data);


    const existente =
      await this.registroDiarioRepositorio.buscarPorEstudanteEData(
        dto.estudanteId,
        dataOperacao,
      );

    const dados = {
      scoreComportamento: dto.scoreComportamento,
      scoreInteracao: dto.scoreInteracao,
      scoreFoco: dto.scoreFoco,
      scoreAutonomia: dto.scoreAutonomia,
      statusAlimentacao: dto.statusAlimentacao,
      usoBanheiro: dto.usoBanheiro,
      anotacoes: dto.anotacoes,
      preenchido: dto.preenchido ?? true,
    };

    if (existente) {
      return this.registroDiarioRepositorio.atualizar(existente.id, dados);
    } else {
      return this.registroDiarioRepositorio.criar({
        ...dados,
        estudanteId: dto.estudanteId,
        educadorId: dto.educadorId,
        data: dataOperacao,
      });
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.registroDiarioRepositorio.remover(id);
  }

  @Cron('0 1 * * 1-5')
  async gerarRegistrosDiariosAutomaticamente() {
    this.logger.log('Iniciando rotina de geração de Registos Diários');

    try {
      const estudantesAtivos =
        await this.registroDiarioRepositorio.buscarEstudantesParaGeracaoAutomatica();

      const registrosParaCriar: {
        estudanteId: string;
        educadorId: string;
        data: Date;
        preenchido: boolean;
        scoreComportamento: number;
        scoreInteracao: number;
        scoreFoco: number;
        scoreAutonomia: number;
        statusAlimentacao: number;
        usoBanheiro: number;
      }[] = [];

      const dataDeHoje = new Date();

      for (const estudante of estudantesAtivos) {
        const turmaRegencia = estudante.turmas[0];

        if (turmaRegencia && turmaRegencia.educadorId) {
          registrosParaCriar.push({
            estudanteId: estudante.id,
            educadorId: turmaRegencia.educadorId,
            data: dataDeHoje,
            preenchido: false,
            scoreComportamento: 0,
            scoreInteracao: 0,
            scoreFoco: 0,
            scoreAutonomia: 0,
            statusAlimentacao: 0,
            usoBanheiro: 0,
          });
        }
      }

      if (registrosParaCriar.length > 0) {
        const resultado =
          await this.registroDiarioRepositorio.criarVarios(registrosParaCriar);
        this.logger.log(
          `${resultado.count} cartões em branco gerados com sucesso.`,
        );
      } else {
        this.logger.log(
          'Nenhum estudante/turma apto para gerar registos hoje.',
        );
      }
    } catch (error) {
      this.logger.error('Erro ao gerar registos diários:', error);
    }
  }

  async getStudentAnalytics(
    studentId: string,
    periodo: string,
    categoria?: string,
    dataInicio?: string,
    dataFim?: string,
  ) {
    let inicioBusca: Date;
    let fimBusca: Date;

    if (dataInicio && dataFim) {
      inicioBusca = new Date(`${dataInicio.split('T')[0]}T00:00:00.000Z`);
      fimBusca = new Date(`${dataFim.split('T')[0]}T23:59:59.999Z`);
    } else {
      inicioBusca = this.getDateLimitByPeriod(periodo);
      inicioBusca.setUTCHours(0, 0, 0, 0);
      fimBusca = new Date();
    }

    const registros =
      await this.registroDiarioRepositorio.buscarRegistrosPorIntervalo(
        studentId,
        inicioBusca,
        fimBusca,
      );

    const labels =
      dataInicio && dataFim
        ? ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
        : this.generateLabels(periodo);

    const numLabels = labels.length;

    const agrupamento = {
      Comportamento: Array.from({ length: numLabels }, () => [] as number[]),
      Interação: Array.from({ length: numLabels }, () => [] as number[]),
      Foco: Array.from({ length: numLabels }, () => [] as number[]),
      Autonomia: Array.from({ length: numLabels }, () => [] as number[]),
      Alimentação: Array.from({ length: numLabels }, () => [] as number[]),
      Banheiro: Array.from({ length: numLabels }, () => [] as number[]),
    };

    registros.forEach((registro) => {
      let index = -1;

      if (dataInicio && dataFim) {
        const diaDaSemana = registro.data.getUTCDay();

        if (diaDaSemana >= 1 && diaDaSemana <= 5) {
          index = diaDaSemana - 1;
        }
      } else {
        const timeDiff = registro.data.getTime() - inicioBusca.getTime();
        const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

        if (periodo === 'semana') {
          index = daysDiff;
        } else if (periodo === 'mes') {
          index = Math.floor(daysDiff / 7);
        } else if (periodo === 'semestre') {
          const monthDiff =
            (registro.data.getUTCFullYear() - inicioBusca.getUTCFullYear()) *
              12 +
            (registro.data.getUTCMonth() - inicioBusca.getUTCMonth());
          index = monthDiff;
        }

        if (index >= numLabels) {
          index = numLabels - 1;
        }
      }

      if (index >= 0 && index < numLabels) {
        agrupamento.Comportamento[index]!.push(registro.scoreComportamento);
        agrupamento.Interação[index]!.push(registro.scoreInteracao);
        agrupamento.Foco[index]!.push(registro.scoreFoco);
        agrupamento.Autonomia[index]!.push(registro.scoreAutonomia);
        agrupamento.Alimentação[index]!.push(registro.statusAlimentacao);
        agrupamento.Banheiro[index]!.push(registro.usoBanheiro);
      }
    });

    let datasets = Object.keys(agrupamento).map((indicador) => {
      const valoresAgrupados =
        agrupamento[indicador as keyof typeof agrupamento];
      const medias = valoresAgrupados.map((valores) => {
        if (valores.length === 0) return 0;
        const soma = valores.reduce((acc, val) => acc + Number(val || 0), 0);
        return parseFloat((soma / valores.length).toFixed(1));
      });
      return { label: indicador, data: medias };
    });

    if (categoria) {
      datasets = datasets.filter((d) => categoria.includes(d.label));
    }

    return { labels, datasets };
  }

  private getDateLimitByPeriod(periodo: string): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (periodo === 'semestre') {
      now.setMonth(now.getMonth() - 6);
    } else if (periodo === 'mes') {
      now.setDate(now.getDate() - 30);
    } else {
      now.setDate(now.getDate() - 7);
    }

    return now;
  }

  private generateLabels(periodo: string): string[] {
    if (periodo === 'semestre') {
      const labels = [];
      const hoje = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        labels.push(
          d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        );
      }
      return labels;
    }
    if (periodo === 'mes') return ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];

    const labels = [];
    const hoje = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      labels.push(
        d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      );
    }
    return labels;
  }



  async getDashboardSummary(studentId: string, periodo: string) {

    const { atualInicio, atualFim, anteriorInicio, anteriorFim } = this.getIntervalosDeComparacao(periodo);
    
    // Disparamos as consultas paralelamente para otimização de I/O no Postgres
    const [
      registrosAtuais, 
      registrosAnteriores,
      aulasAtuais,
      aulasAnteriores
    ] = await Promise.all([
      this.registroDiarioRepositorio.buscarRegistrosPorIntervalo(studentId, atualInicio, atualFim),
      this.registroDiarioRepositorio.buscarRegistrosPorIntervalo(studentId, anteriorInicio, anteriorFim),
      this.prisma.client.registroAula.findMany({
        where: {
          estudanteId: studentId,
          data: { gte: atualInicio, lte: atualFim },
          status_aula: StatusAula.REALIZADA 
        },
        select: { presenca: true }
      }),
      this.prisma.client.registroAula.findMany({
        where: {
          estudanteId: studentId,
          data: { gte: anteriorInicio, lte: anteriorFim },
          status_aula: StatusAula.REALIZADA
        },
        select: { presenca: true }
      })
    ]);

    const mediasAtuais = this.calcularMedias(registrosAtuais);
    const mediasAnteriores = this.calcularMedias(registrosAnteriores);
    const mediaGeralAtual = this.calcularMediaGlobal(mediasAtuais);
    const mediaGeralAnterior = this.calcularMediaGlobal(mediasAnteriores);
    const calcularMetricasFrequencia = (aulas: { presenca: boolean }[]) => {
      if (aulas.length === 0) return 0;
      const totaisPresencas = aulas.filter(a => a.presenca).length;
      return (totaisPresencas / aulas.length) * 100;
    };

    const frequenciaAtual = calcularMetricasFrequencia(aulasAtuais);
    const frequenciaAnterior = calcularMetricasFrequencia(aulasAnteriores);
    const variacaoFrequencia = frequenciaAtual - frequenciaAnterior;

    return {
      mediaGeral: {
        valor: mediaGeralAtual,
        variacao: this.calcularVariacao(mediaGeralAtual, mediaGeralAnterior),
      },
      categorias: {
        Alimentacao: {
          valor: mediasAtuais.statusAlimentacao,
          variacao: this.calcularVariacao(
            mediasAtuais.statusAlimentacao,
            mediasAnteriores.statusAlimentacao,
          ),
        },
        Banheiro: {
          valor: mediasAtuais.usoBanheiro,
          variacao: this.calcularVariacao(
            mediasAtuais.usoBanheiro,
            mediasAnteriores.usoBanheiro,
          ),
        },
        Autonomia: {
          valor: mediasAtuais.scoreAutonomia,
          variacao: this.calcularVariacao(
            mediasAtuais.scoreAutonomia,
            mediasAnteriores.scoreAutonomia,
          ),
        },
        Comportamento: {
          valor: mediasAtuais.scoreComportamento,
          variacao: this.calcularVariacao(
            mediasAtuais.scoreComportamento,
            mediasAnteriores.scoreComportamento,
          ),
        },
        Interacao: {
          valor: mediasAtuais.scoreInteracao,
          variacao: this.calcularVariacao(
            mediasAtuais.scoreInteracao,
            mediasAnteriores.scoreInteracao,
          ),
        },
        Foco: {
          valor: mediasAtuais.scoreFoco,
          variacao: this.calcularVariacao(
            mediasAtuais.scoreFoco,
            mediasAnteriores.scoreFoco,
          ),
        },
      },
      frequencia: {
        valor: parseFloat(frequenciaAtual.toFixed(1)), 
        variacao: parseFloat(variacaoFrequencia.toFixed(1))
      }
    };
  }

  private calcularMedias(registros: any[]) {
    if (registros.length === 0) {
      return {
        scoreComportamento: 0,
        scoreInteracao: 0,
        scoreFoco: 0,
        scoreAutonomia: 0,
        statusAlimentacao: 0,
        usoBanheiro: 0,
      };
    }

    const soma = registros.reduce(
      (acc, r) => ({
        scoreComportamento: acc.scoreComportamento + r.scoreComportamento,
        scoreInteracao: acc.scoreInteracao + r.scoreInteracao,
        scoreFoco: acc.scoreFoco + r.scoreFoco,
        scoreAutonomia: acc.scoreAutonomia + r.scoreAutonomia,
        statusAlimentacao: acc.statusAlimentacao + r.statusAlimentacao,
        usoBanheiro: acc.usoBanheiro + r.usoBanheiro,
      }),
      {
        scoreComportamento: 0,
        scoreInteracao: 0,
        scoreFoco: 0,
        scoreAutonomia: 0,
        statusAlimentacao: 0,
        usoBanheiro: 0,
      },
    );

    const total = registros.length;
    return {
      scoreComportamento: parseFloat(
        (soma.scoreComportamento / total).toFixed(1),
      ),
      scoreInteracao: parseFloat((soma.scoreInteracao / total).toFixed(1)),
      scoreFoco: parseFloat((soma.scoreFoco / total).toFixed(1)),
      scoreAutonomia: parseFloat((soma.scoreAutonomia / total).toFixed(1)),
      statusAlimentacao: parseFloat(
        (soma.statusAlimentacao / total).toFixed(1),
      ),
      usoBanheiro: parseFloat((soma.usoBanheiro / total).toFixed(1)),
    };
  }

  private calcularMediaGlobal(medias: Record<string, number>): number {
    const valores = Object.values(medias);
    const soma = valores.reduce((acc, val) => acc + val, 0);
    return parseFloat((soma / 6).toFixed(1));
  }

  private calcularVariacao(atual: number, anterior: number): number {
    if (anterior === 0) return atual > 0 ? atual : 0;
    return parseFloat((atual - anterior).toFixed(1));
  }

  private getIntervalosDeComparacao(periodo: string) {
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
      // 'semana'
      atualInicio.setDate(atualInicio.getDate() - 7);
      anteriorFim.setDate(anteriorFim.getDate() - 7);
      anteriorInicio.setDate(anteriorInicio.getDate() - 14);
    }

    return { atualInicio, atualFim, anteriorInicio, anteriorFim };
  }
}
