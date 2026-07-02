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
        descricao: true,
        educador: {
          select: { id: true, nome: true, escolaId: true },
        },
      },
      orderBy: { dataEvento: 'asc' },
    });
  }

  async criar(dto: CreateEventoDto): Promise<EventoListagem> {
    return this.prisma.client.aula.create({
      data: {
        isEvento: true,
        titulo: dto.titulo,
        descricao: dto.descricao,
        dataEvento: new Date(dto.dataEvento),
        educadorId: dto.educadorId,
      },
      select: {
        id: true,
        titulo: true,
        dataEvento: true,
        descricao: true,
        educador: {
          select: { id: true, nome: true, escolaId: true },
        },
      },
    });
  }

  async atualizar(id: string, dto: UpdateEventoDto): Promise<EventoListagem> {
    return this.prisma.client.aula.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        dataEvento: dto.dataEvento ? new Date(dto.dataEvento) : undefined,
      },
      select: {
        id: true,
        titulo: true,
        dataEvento: true,
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
}
