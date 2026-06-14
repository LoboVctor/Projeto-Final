import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { EstudantesService } from './estudantes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'; 

@Controller('estudantes')
@UseGuards(JwtAuthGuard) // Protege a rota para apenas usuários logados (professores/coordenadores)
export class EstudantesController {
  constructor(private readonly estudantesService: EstudantesService) {}

  @Get(':id/saude')
  async buscarDadosSaude(@Param('id') id: string) {
    return this.estudantesService.getSaude(id);
  }
}