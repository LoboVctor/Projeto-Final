import { Injectable, Inject } from '@nestjs/common';
import type { IEstudoCasoRepositorio, EstudoDeCasoComEducadores } from './interfaces/IEstudoCasoRepositorio.js';
import type { CreateEstudoDeCasoDto } from './dtos/create-estudo-de-caso.dto.js';

@Injectable()
export class EstudoCasoService {
  constructor(
    @Inject('IEstudoCasoRepositorio')
    private readonly estudoCasoRepositorio: IEstudoCasoRepositorio,
  ) { }

  /**
   * Registra um novo Estudo de Caso / Ocorrência Pedagógica.
   * A validação da existência do estudante e dos educadores é garantida pelas
   * foreign keys do Prisma — qualquer ID inválido resultará em um erro capturado
   * pelo HttpExceptionFilter global.
   */
  async criar(dto: CreateEstudoDeCasoDto) {
    const estudoCaso: EstudoDeCasoComEducadores = await this.estudoCasoRepositorio.criar(dto);

    return {
      id: estudoCaso.id,
      estudante: estudoCaso.estudante,
      dataReuniao: estudoCaso.dataReuniao,
      parecerDecisao: estudoCaso.parecerDecisao,
      educadores: estudoCaso.educadores.map((e) => ({
        id: e.id,
        nome: e.nome,
      })),
    };
  }
}
