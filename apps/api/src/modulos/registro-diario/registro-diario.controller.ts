import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RegistroDiarioService } from './registro-diario.service.js';
import { CreateRegistrosDiarioDto } from './dtos/create-registros-diario.dto.js';
import { UpdateRegistrosDiarioDto } from './dtos/update-registros-diario.dto.js';

@Controller('registros-diarios')
export class RegistroDiarioController {
  constructor(private readonly registroDiarioService: RegistroDiarioService) {}

  @Post()
  create(@Body() createRegistrosDiarioDto: CreateRegistrosDiarioDto) {
    return this.registroDiarioService.create(createRegistrosDiarioDto);
  }

  @Get('alertas')
  findAlertas(@Query('educadorId') educadorId: string) {
    return this.registroDiarioService.findAlertasDiasAnteriores(educadorId);
  }

  @Get('resumo-mensal')
  getResumoMensal(@Query('educadorId') educadorId: string) {
    return this.registroDiarioService.getResumoMensal(educadorId);
  }
  
  @Get()
  findAll() {
    return this.registroDiarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registroDiarioService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRegistrosDiarioDto: UpdateRegistrosDiarioDto) {
    return this.registroDiarioService.update(id, updateRegistrosDiarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registroDiarioService.remove(id);
  }
}