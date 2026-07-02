import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { EstudoCasoService } from './estudo-de-caso.service.js';
import { CreateEstudoDeCasoDto } from './dtos/create-estudo-de-caso.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Estudo de Caso')
@ApiBearerAuth()
@Controller('estudo-de-caso')
@UseGuards(JwtAuthGuard)
export class EstudoCasoController {
  constructor(private readonly estudoCasoService: EstudoCasoService) {}

  /**
   * Registra uma reunião pedagógica urgente ou ocorrência emergencial.
   * Associa automaticamente os educadores participantes informados no payload.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra um novo Estudo de Caso / Ocorrência Pedagógica',
  })
  @ApiCreatedResponse({ description: 'Estudo de Caso criado com sucesso.' })
  async criar(@Body() dto: CreateEstudoDeCasoDto) {
    return this.estudoCasoService.criar(dto);
  }
}
