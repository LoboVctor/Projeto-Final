import { Module } from '@nestjs/common';
import { EventoController } from './evento.controller.js';
import { EventoService } from './evento.service.js';
import { EventoRepository } from './evento.repository.js';

@Module({
  controllers: [EventoController],
  providers: [
    EventoService,
    {
      provide: 'IEventoRepositorio',
      useClass: EventoRepository,
    },
  ],
  exports: [EventoService],
})
export class EventoModule {}
