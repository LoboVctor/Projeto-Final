import { PartialType } from '@nestjs/swagger';
import { CreateEventoDto } from './create-evento.dto.js';

export class UpdateEventoDto extends PartialType(CreateEventoDto) {}
