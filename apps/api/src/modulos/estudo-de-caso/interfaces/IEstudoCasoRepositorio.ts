import { Prisma } from '@prisma-client';
import { CreateEstudoDeCasoDto } from '../dtos/create-estudo-de-caso.dto.js';

export type EstudoDeCasoComEducadores = Prisma.EstudoCasoGetPayload<{
  include: {
    educadores: {
      select: { id: true; nome: true };
    };
    estudante: { select: { id: true; nomeCompleto: true } };
  };
}>;

export interface IEstudoCasoRepositorio {
  criar(dto: CreateEstudoDeCasoDto): Promise<EstudoDeCasoComEducadores>;
}
