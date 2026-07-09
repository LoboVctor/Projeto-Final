import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import type { IEventoRepositorio } from './interfaces/IEventoRepositorio.js';
import { CreateEventoDto } from './dtos/create-evento.dto.js';
import { UpdateEventoDto } from './dtos/update-evento.dto.js';

@Injectable()
export class EventoService {
  private readonly logger = new Logger(EventoService.name);

  constructor(
    @Inject('IEventoRepositorio')
    private readonly eventoRepositorio: IEventoRepositorio,
  ) {}

  async buscarEventosDoMes(mes: number, ano: number, escolaId: string) {
    try {
      return await this.eventoRepositorio.buscarEventosDoMes(
        mes,
        ano,
        escolaId,
      );
    } catch (error) {
      this.logger.error(`Erro ao buscar eventos do mês ${mes}/${ano}`, error);
      throw error;
    }
  }

  async criar(dto: CreateEventoDto) {
    try {
      return await this.eventoRepositorio.criar(dto);
    } catch (error) {
      this.logger.error('Erro ao criar evento', error);
      throw error;
    }
  }

  async atualizar(id: string, dto: UpdateEventoDto) {
    try {
      return await this.eventoRepositorio.atualizar(id, dto);
    } catch (error) {
      this.logger.error(`Erro ao atualizar evento ${id}`, error);
      throw error;
    }
  }

  async remover(id: string) {
    try {
      await this.eventoRepositorio.remover(id);
    } catch (error) {
      this.logger.error(`Erro ao remover evento ${id}`, error);
      throw error;
    }
  }

  async buscarProximosEventos(escolaId: string, limite: number) {
    try {
      return await this.eventoRepositorio.buscarProximosEventos(escolaId, limite);
    } catch (error) {
      this.logger.error('Erro ao buscar próximos eventos', error);
      throw error;
    }
  }
}
