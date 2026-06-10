import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RegistrosDiariosService } from './registros-diarios.service';
import { CreateRegistrosDiarioDto } from './dto/create-registros-diario.dto';
import { UpdateRegistrosDiarioDto } from './dto/update-registros-diario.dto';

@Controller('registros-diarios')
export class RegistrosDiariosController {
  constructor(private readonly registrosDiariosService: RegistrosDiariosService) {}

  @Post()
  create(@Body() createRegistrosDiarioDto: CreateRegistrosDiarioDto) {
    return this.registrosDiariosService.create(createRegistrosDiarioDto);
  }

  @Get('alertas')
  findAlertas(@Query('educadorId') educadorId: string) {
    return this.registrosDiariosService.findAlertasDiasAnteriores(educadorId);
  }

  @Get('resumo-mensal')
  getResumoMensal(@Query('educadorId') educadorId: string) {
    return this.registrosDiariosService.getResumoMensal(educadorId);
  }
  
  @Get()
  findAll() {
    return this.registrosDiariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registrosDiariosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRegistrosDiarioDto: UpdateRegistrosDiarioDto) {
    return this.registrosDiariosService.update(id, updateRegistrosDiarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registrosDiariosService.remove(id);
  }
}