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
    return this.registroDiarioRepositorio.criar({
      estudanteId: dto.estudanteId,
      educadorId: dto.educadorId,
      data: new Date(),
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