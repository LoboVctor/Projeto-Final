import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TipoEducador, Role } from '../../../../../infra/generated/prisma/index.js';


const MAPA_TIPO_PARA_ROLE: Record<TipoEducador, Role> = {
  [TipoEducador.REGENTE]: Role.PROFESSOR_REGENTE,
  [TipoEducador.ATENDIMENTO]: Role.PROFESSOR_ATENDIMENTO,
  [TipoEducador.COORDENADOR]: Role.COORDENADOR,
};

export interface FiltrosEducador {
  nome?: string;
  matricula?: string;
  tipo?: TipoEducador;
  /** 'ativos' | 'inativos' | 'todos' */
  status?: string;
  page: number;
  limit: number;
}

export interface AtualizarEducadorDados {
  nome?: string;
  cpf?: string;
  telefone?: string;
  tipo?: TipoEducador;
  dataContratacao?: string;
  turmaIds?: string[];
}

export interface CriarEducadorDados {
  nome: string;
  matricula: string;
  cpf: string;
  email: string;
  telefone: string;
  tipo: TipoEducador;
  dataContratacao: string;
  turmaIds?: string[];
}

@Injectable()
export class EducadorRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: FiltrosEducador) {
    const { nome, matricula, tipo, status, page, limit } = filtros;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (nome) {
      where['nome'] = { startsWith: nome, mode: 'insensitive' };
    }
    if (matricula) {
      where['matricula'] = { contains: matricula, mode: 'insensitive' };
    }
    if (tipo) {
      where['tipo'] = tipo;
    }

    // Filtro de status: por padrão mostra somente ativos
    if (status === 'inativos') {
      where['ativo'] = false;
    } else if (status === 'todos') {
      // nenhum filtro de ativo
    } else {
      // 'ativos' ou ausente → apenas ativos
      where['ativo'] = true;
    }

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.educador.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: 'asc' },
        select: {
          id: true,
          matricula: true,
          nome: true,
          tipo: true,
          telefone: true,
          ativo: true,
          turmas: {
            select: { id: true, nome: true },
          },
          usuario: {
            select: { id: true, bloqueado: true },
          },
        },
      }),
      this.prisma.client.educador.count({ where }),
    ]);

    return { data, total, totalPaginas: Math.ceil(total / limit) };
  }

  async buscarPorId(id: string) {
    return this.prisma.client.educador.findUnique({
      where: { id },
      select: {
        id: true,
        matricula: true,
        nome: true,
        cpf: true,
        telefone: true,
        tipo: true,
        dataContratacao: true,
        ativo: true,
        turmas: { select: { id: true, nome: true } },
        usuario: { select: { id: true, bloqueado: true } },
      },
    });
  }

  async criar(dados: CriarEducadorDados, escolaId: string, hashSenha: string) {
    const { turmaIds, email, ...camposScalares } = dados;

    return this.prisma.client.educador.create({
      data: {
        ...camposScalares,
        dataContratacao: new Date(camposScalares.dataContratacao),
        escolaId,
        // Cria também as turmas, se enviadas
        ...(turmaIds?.length
          ? {
              turmas: {
                connect: turmaIds.map((tid) => ({ id: tid })),
              },
            }
          : {}),
        // Cria o Usuário vinculado
        usuario: {
          create: {
            email,
            senha: hashSenha,
            role: MAPA_TIPO_PARA_ROLE[camposScalares.tipo],
            bloqueado: false,
          },
        },
      },
      select: {
        id: true,
        nome: true,
        tipo: true,
        telefone: true,
        ativo: true,
        turmas: { select: { id: true, nome: true } },
      },
    });
  }

  async atualizar(id: string, dados: AtualizarEducadorDados) {
    const { turmaIds, ...camposScalares } = dados;

    return this.prisma.client.educador.update({
      where: { id },
      data: {
        ...camposScalares,
        ...(camposScalares.dataContratacao
          ? { dataContratacao: new Date(camposScalares.dataContratacao) }
          : {}),
        // Sincroniza as turmas: substitui o conjunto completo de associações
        ...(turmaIds !== undefined
          ? {
              turmas: {
                set: turmaIds.map((tid) => ({ id: tid })),
              },
            }
          : {}),
      },
      select: {
        id: true,
        nome: true,
        tipo: true,
        telefone: true,
        ativo: true,
        turmas: { select: { id: true, nome: true } },
      },
    });
  }

  async desativar(id: string) {
    // Soft delete no educador e bloqueio do usuário em uma transação
    return this.prisma.client.$transaction(async (tx) => {
      await tx.educador.update({
        where: { id },
        data: { ativo: false },
      });

      // Bloqueia o login sem apagar o usuário
      await tx.usuario.updateMany({
        where: { educadorId: id },
        data: { bloqueado: true },
      });
    });
  }

  async reativar(id: string) {
    return this.prisma.client.$transaction(async (tx) => {
      await tx.educador.update({
        where: { id },
        data: { ativo: true },
      });

      await tx.usuario.updateMany({
        where: { educadorId: id },
        data: { bloqueado: false },
      });
    });
  }
}
