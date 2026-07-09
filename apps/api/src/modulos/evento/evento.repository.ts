import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  IEventoRepositorio,
  EventoListagem,
} from './interfaces/IEventoRepositorio.js';
import { CreateEventoDto } from './dtos/create-evento.dto.js';
import { UpdateEventoDto } from './dtos/update-evento.dto.js';

@Injectable()
export class EventoRepository implements IEventoRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async buscarEventosDoMes(
    mes: number,
    ano: number,
    escolaId: string,
  ): Promise<EventoListagem[]> {
    const dataInicial = new Date(ano, mes - 1, 1);
    const dataFinal = new Date(ano, mes, 0);

    return this.prisma.client.aula.findMany({
      where: {
        isEvento: true,
        dataEvento: {
          gte: dataInicial,
          lte: dataFinal,
        },
        educador: {
          escolaId: escolaId,
        },
      },
      select: {
        id: true,
        titulo: true,
        dataEvento: true,
        horarioInicio: true,
        horarioFim: true,
        descricao: true,
        educador: {
          select: { id: true, nome: true, escolaId: true },
        },
      },
      orderBy: { dataEvento: 'asc' },
    });
  }

  async criar(dto: CreateEventoDto): Promise<EventoListagem> {
    const dataEventoDate = new Date(dto.dataEvento);
    // Ajusta para compensar o fuso horário do Brasil (UTC-3)
    const dataAjustada = new Date(dataEventoDate.getTime() + (3 * 60 * 60 * 1000));
    return this.prisma.client.aula.create({
      data: {
        isEvento: true,
        titulo: dto.titulo,
        descricao: dto.descricao,
        dataEvento: dataAjustada,
        horarioInicio: dataAjustada,
        horarioFim: dataAjustada,
        educadorId: dto.educadorId,
      },
      select: {
        id: true,
        titulo: true,
        dataEvento: true,
        horarioInicio: true,
        horarioFim: true,
        descricao: true,
        educador: {
          select: { id: true, nome: true, escolaId: true },
        },
      },
    });
  }

  async atualizar(id: string, dto: UpdateEventoDto): Promise<EventoListagem> {
    const dataEventoDate = dto.dataEvento ? new Date(dto.dataEvento) : undefined;
    const dataAjustada = dataEventoDate ? new Date(dataEventoDate.getTime() + (3 * 60 * 60 * 1000)) : undefined;
    return this.prisma.client.aula.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        dataEvento: dataAjustada,
        horarioInicio: dataAjustada,
        horarioFim: dataAjustada,
      },
      select: {
        id: true,
        titulo: true,
        dataEvento: true,
        horarioInicio: true,
        horarioFim: true,
        descricao: true,
        educador: {
          select: { id: true, nome: true, escolaId: true },
        },
      },
    });
  }

  async remover(id: string): Promise<void> {
    await this.prisma.client.aula.delete({ where: { id } });
  }

  async buscarProximosEventos(
    escolaId: string,
    limite: number,
  ): Promise<EventoListagem[]> {
    const agora = new Date();
    // Normaliza para o início do dia atual (sem hora) para incluir eventos de hoje
    const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

    return this.prisma.client.aula.findMany({
      where: {
        isEvento: true,
        dataEvento: { gte: hoje },
        educador: { escolaId },
      },
      select: {
        id: true,
        titulo: true,
        dataEvento: true,
        horarioInicio: true,
        horarioFim: true,
        descricao: true,
        educador: {
          select: { id: true, nome: true, escolaId: true },
        },
      },
      orderBy: { dataEvento: 'asc' },
      take: limite,
    });
  }
}
