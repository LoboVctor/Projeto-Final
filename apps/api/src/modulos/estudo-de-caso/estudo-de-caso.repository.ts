import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IEstudoCasoRepositorio, EstudoDeCasoComEducadores } from './interfaces/IEstudoCasoRepositorio.js';
import type { CreateEstudoDeCasoDto } from './dtos/create-estudo-de-caso.dto.js';

@Injectable()
export class EstudoCasoRepository implements IEstudoCasoRepositorio {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CreateEstudoDeCasoDto): Promise<EstudoDeCasoComEducadores> {
    return this.prisma.client.estudoCaso.create({
      data: {
        estudanteId: dto.estudanteId,
        dataReuniao: new Date(dto.dataReuniao),
        parecerDecisao: dto.parecerDecisao,
        educadores: {
          connect: dto.educadoresIds.map((id) => ({ id })),
        },
      },
      include: {
        educadores: {
          select: { id: true, nome: true },
        },
        estudante: { select: { id: true, nomeCompleto: true } },
      },
    });
  }
}
