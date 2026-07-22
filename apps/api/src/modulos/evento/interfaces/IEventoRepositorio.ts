import { Prisma } from '@prisma-client';
import { CreateEventoDto } from '../dtos/create-evento.dto.js';
import { UpdateEventoDto } from '../dtos/update-evento.dto.js';

export type EventoListagem = Prisma.AulaGetPayload<{
  select: {
    id: true;
    titulo: true;
    dataEvento: true;
    descricao: true;
    educador: {
      select: { id: true; nome: true; escolaId: true };
    };
  };
}>;

export interface IEventoRepositorio {
  buscarEventosDoMes(
    mes: number,
    ano: number,
    escolaId: string,
    role: string,
    educadorId: string | null,
  ): Promise<EventoListagem[]>;
  criar(dto: CreateEventoDto): Promise<EventoListagem>;
  atualizar(id: string, dto: UpdateEventoDto): Promise<EventoListagem>;
  remover(id: string): Promise<void>;
  buscarProximosEventos(
    escolaId: string,
    limite: number,
    role: string,
    educadorId: string | null,
  ): Promise<EventoListagem[]>;
}
