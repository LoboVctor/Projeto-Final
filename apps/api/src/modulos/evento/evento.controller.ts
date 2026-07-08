import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EventoService } from './evento.service.js';
import { CreateEventoDto } from './dtos/create-evento.dto.js';
import { UpdateEventoDto } from './dtos/update-evento.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Eventos')
@ApiBearerAuth()
@Controller('eventos')
@UseGuards(JwtAuthGuard)
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  @Get()
  @ApiOperation({ summary: 'Lista eventos do mês para a escola' })
  @ApiQuery({ name: 'mes', type: Number })
  @ApiQuery({ name: 'ano', type: Number })
  @ApiQuery({ name: 'escolaId', type: String })
  async buscarEventosDoMes(
    @Query('mes') mes: string,
    @Query('ano') ano: string,
    @Query('escolaId') escolaId: string,
  ) {
    return this.eventoService.buscarEventosDoMes(
      Number(mes),
      Number(ano),
      escolaId,
    );
  }

  @Get('proximos')
  @ApiOperation({ summary: 'Lista próximos eventos da escola a partir de hoje' })
  @ApiQuery({ name: 'escolaId', type: String })
  @ApiQuery({ name: 'limite', type: Number, required: false })
  async buscarProximosEventos(
    @Query('escolaId') escolaId: string,
    @Query('limite') limite = '4',
  ) {
    return this.eventoService.buscarProximosEventos(escolaId, Number(limite));
  }

  @Post()
  @ApiOperation({ summary: 'Cria um evento esporádico' })
  async criar(@Body() dto: CreateEventoDto) {
    return this.eventoService.criar(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um evento existente' })
  async atualizar(@Param('id') id: string, @Body() dto: UpdateEventoDto) {
    return this.eventoService.atualizar(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um evento' })
  async remover(@Param('id') id: string) {
    return this.eventoService.remover(id);
  }
}
