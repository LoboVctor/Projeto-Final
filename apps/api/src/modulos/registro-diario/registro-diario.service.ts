import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import type { IRegistroDiarioRepositorio } from './interfaces/IRegistroDiarioRepositorio.js';
import { CreateRegistrosDiarioDto } from './dtos/create-registros-diario.dto.js';
import { UpdateRegistrosDiarioDto } from './dtos/update-registros-diario.dto.js';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RegistroDiarioService {
  private readonly logger = new Logger(RegistroDiarioService.name);

  constructor(
    @Inject('IRegistroDiarioRepositorio')
    private readonly registroDiarioRepositorio: IRegistroDiarioRepositorio
  ) {}

  async create(dto: CreateRegistrosDiarioDto) {
    const dataSegura = dto.data ? this.parseDateOnlyToSafeDate(dto.data) : new Date();

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
    return this.registroDiarioRepositorio.buscarAlertasDiasAnteriores(educadorId);
  }

  async getResumoMensal(educadorId: string) {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const [totalPreenchidos, totalEsperado] = await Promise.all([
      this.registroDiarioRepositorio.contarRegistrosPreenchidos(educadorId, primeiroDiaDoMes, hoje),
      this.registroDiarioRepositorio.contarRegistrosEsperados(educadorId, primeiroDiaDoMes, hoje),
    ]);

    return { totalEsperado, totalPreenchidos };
  }

  async findOne(id: string) {
    const registro = await this.registroDiarioRepositorio.buscarPorId(id);

    if (!registro) throw new NotFoundException(`Registo diário com ID ${id} não encontrado.`);
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
    return new Date(Date.UTC(year!, month! - 1, day!, 12, 0, 0));
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

    const registros = await this.registroDiarioRepositorio.buscarPorPeriodo(estudanteId, domingo, sabado);


    const semana = [];
    for (let i = 0; i < 7; i++) {
      const dataAtual = new Date(domingo);
      dataAtual.setUTCDate(domingo.getUTCDate() + i);
      dataAtual.setUTCHours(12, 0, 0, 0); 
      
      const registroDoDia = registros.find(r => {
        const d = new Date(r.data);
        return d.getUTCDate() === dataAtual.getUTCDate() && 
               d.getUTCMonth() === dataAtual.getUTCMonth() && 
               d.getUTCFullYear() === dataAtual.getUTCFullYear();
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


    const inicioDia = new Date(dataOperacao);
    inicioDia.setUTCHours(0, 0, 0, 0);
    const fimDia = new Date(dataOperacao);
    fimDia.setUTCHours(23, 59, 59, 999);

    const existente = await this.registroDiarioRepositorio.buscarPorEstudanteEData(dto.estudanteId, dataOperacao);

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

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async gerarRegistrosDiariosAutomaticamente() {
    this.logger.log('Iniciando rotina de geração de Registos Diários...');

    try {
      const estudantesAtivos = await this.registroDiarioRepositorio.buscarEstudantesParaGeracaoAutomatica();

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
        const resultado = await this.registroDiarioRepositorio.criarVarios(registrosParaCriar);
        this.logger.log(`${resultado.count} cartões em branco gerados com sucesso.`);
      } else {
        this.logger.log('Nenhum estudante/turma apto para gerar registos hoje.');
      }
    } catch (error) {
      this.logger.error('Erro ao gerar registos diários:', error);
    }
  }
}