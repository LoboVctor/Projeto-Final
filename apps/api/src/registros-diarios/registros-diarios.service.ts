import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegistrosDiarioDto } from './dto/create-registros-diario.dto';
import { UpdateRegistrosDiarioDto } from './dto/update-registros-diario.dto';
import { Cron, CronExpression } from '@nestjs/schedule'; // <-- Importar o Cron

@Injectable()
export class RegistrosDiariosService {

  private readonly logger = new Logger(RegistrosDiariosService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRegistrosDiarioDto) {
    return this.prisma.client.registroDiario.create({
      data: {
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
      },
    });
  }

  async findAll() {
    return this.prisma.client.registroDiario.findMany({
      include: { estudante: true, educador: true },
      orderBy: { data: 'desc' },
    });
  }

  async findAlertasDiasAnteriores(educadorId: string) {
    const inicioDoDiaAtual = new Date();
    inicioDoDiaAtual.setHours(0, 0, 0, 0);

    return this.prisma.client.registroDiario.findMany({
      where: {
        data: { lt: inicioDoDiaAtual },
        preenchido: false,
        educadorId: educadorId,
      },
      include: { estudante: true },
      orderBy: { data: 'desc' },
    });
  }

  async getResumoMensal(educadorId: string) {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    // 1. Total de registros que o professor JÁ PREENCHEU este mês
    const totalPreenchidos = await this.prisma.client.registroDiario.count({
      where: { 
        educadorId: educadorId,
        data: { gte: primeiroDiaDoMes, lte: hoje },
        preenchido: true,
      }
    });

    // CORREÇÃO: Total real de registros gerados no banco para este professor no mês (preenchidos ou não)
    const totalEsperado = await this.prisma.client.registroDiario.count({
      where: {
        educadorId: educadorId,
        data: { gte: primeiroDiaDoMes, lte: hoje }
      }
    });

    return { totalEsperado, totalPreenchidos };
  }

  async findOne(id: string) {
    const registro = await this.prisma.client.registroDiario.findUnique({
      where: { id },
      include: { estudante: true, educador: true },
    });

    if (!registro) throw new NotFoundException(`Registo diário com ID ${id} não encontrado.`);
    return registro;
  }

  async update(id: string, dto: UpdateRegistrosDiarioDto) {
    await this.findOne(id);
    const dadosAtualizados = { ...dto, preenchido: true };

    return this.prisma.client.registroDiario.update({
      where: { id },
      data: dadosAtualizados,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.registroDiario.delete({ where: { id } });
  }

// ====================================================================
  // CRON JOB: Geração Automática de Registos Diários
  // ====================================================================
  
  @Cron(CronExpression.EVERY_DAY_AT_1AM) // Roda todo dia às 1h da manhã
  async gerarRegistrosDiariosAutomaticamente() {
    this.logger.log('Iniciando rotina de geração de Registos Diários...');

    try {
  
      const estudantesAtivos = await this.prisma.client.estudante.findMany({
        where: { statusMatricula: true },
        include: {
          turmas: {
            where: { tipo: 'REGENCIA' },
            select: { educadorId: true } 
          }
        }
      });


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
        const resultado = await this.prisma.client.registroDiario.createMany({
          data: registrosParaCriar,
          skipDuplicates: true, 
        });
        this.logger.log(`${resultado.count} cartões em branco gerados com sucesso.`);
      } else {
        this.logger.log('Nenhum estudante/turma apto para gerar registos hoje.');
      }

    } catch (error) {
      this.logger.error('Erro ao gerar registos diários:', error);
    }
  }
}