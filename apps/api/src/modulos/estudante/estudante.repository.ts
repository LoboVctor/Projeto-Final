import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { IEstudanteRepositorio, EstudanteVisaoGeral, EstudanteSaude, EstudantePedagogico, AulaAgenda } from './interfaces/IEstudanteRepositorio.js';
import { Especificidade, EstudanteEspecificidade, TipoEspecificidade, CategoriaEspecificidade } from '@prisma-client';
import type { IEstudanteRepositorio, EstudanteVisaoGeral, EstudanteSaude, EstudantePedagogico, EstudanteListagemPaginado } from './interfaces/IEstudanteRepositorio.js';
import { Especificidade, EstudanteEspecificidade, TipoEspecificidade, CategoriaEspecificidade, TipoDiagnostico, UnidadeM } from '@prisma-client';
import type { BuscarEstudantesQueryDto } from './dtos/buscar-estudantes-query.dto.js';


@Injectable()
export class EstudanteRepository implements IEstudanteRepositorio {
  constructor(private prisma: PrismaService) {}

  async buscarVisaoGeral(estudanteId: string): Promise<EstudanteVisaoGeral | null> {
    return this.prisma.client.estudante.findUnique({
      where: { id: estudanteId },
      include: {
        turmas: {
          include: { educador: true },
        },
        responsaveis: {
          where: { responsavelPrincipal: true },
          include: { responsavel: true },
        },
        especificidades: {
          include: { especificidade: true },
        },
      },
    });
  }

  async buscarSaude(estudanteId: string): Promise<EstudanteSaude | null> {
    return this.prisma.client.estudante.findUnique({
      where: { id: estudanteId },
      select: {
        id: true,
        nomeCompleto: true,
        especificidades: {
          select: {
            especificidadeId: true,
            obsReacao: true,
            especificidade: {
              select: {
                descricao: true,
                categoria: true,
                tipo: true,
              },
            },
          },
        },
        diagnosticos: {
          select: {
            diagnostico: { select: { nome: true } },
            documentos: {
              select: {
                id: true,
                tipo: true,
                arquivo: true,
                dataEmissao: true,
                createdAt: true,
              },
            },
          },
        },
        medicamentos: {
          select: {
            medicamentoId: true,
            dosagem: true,
            unidadeMedida: true,
            intervaloAdministracao: true,
            horarioAdministrado: true,
            administradoEscola: true,
            medicamento: { select: { nome: true } },
          },
        },
      },
    });
  }

  async buscarPedagogico(estudanteId: string): Promise<EstudantePedagogico | null> {
    return this.prisma.client.estudante.findUnique({
      where: { id: estudanteId },
      select: {
        id: true,
        nomeCompleto: true,
        relatoriosSemestrais: {
          orderBy: [{ ano: 'desc' }, { semestre: 'desc' }],
          select: {
            id: true,
            semestre: true,
            ano: true,
            parecerGlobalDesenvolvimento: true,
            status: true,
            dataFechamento: true,
            metas: {
              orderBy: { eixoDesenvolvimento: 'asc' },
              select: {
                id: true,
                descricao: true,
                eixoDesenvolvimento: true,
                scoreFinal: true,
                parecer: true,
                pibis: {
                  orderBy: { bimestre: 'asc' },
                  select: {
                    id: true,
                    bimestre: true,
                    status: true,
                    scoreAtingibilidade: true,
                    parecerEvolutivo: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async buscarComFiltros(query: BuscarEstudantesQueryDto): Promise<EstudanteListagemPaginado> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(query.nome && {
        nomeCompleto: { contains: query.nome, mode: 'insensitive' as const },
      }),
      ...(query.matricula && {
        matricula: { contains: query.matricula, mode: 'insensitive' as const },
      }),
      ...(query.diagnosticoTipo && {
        diagnosticos: {
          some: {
            diagnostico: {
              tipo: query.diagnosticoTipo as TipoDiagnostico,
            },
          },
        },
      }),
    };

    const select = {
      id: true,
      nomeCompleto: true,
      matricula: true,
      foto: true,
      statusMatricula: true,
      turmas: {
        select: { id: true, nome: true },
      },
      diagnosticos: {
        select: {
          diagnostico: { select: { nome: true, tipo: true } },
        },
      },
    } as const;

    const [data, total] = await this.prisma.client.$transaction([
      this.prisma.client.estudante.findMany({ where, select, skip, take: limit, orderBy: { nomeCompleto: 'asc' } }),
      this.prisma.client.estudante.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }

  async buscarEspecificidadeExata(tipo: TipoEspecificidade, categoria: CategoriaEspecificidade, descricao: string): Promise<Especificidade | null> {
    return this.prisma.client.especificidade.findFirst({
      where: {
        tipo,
        categoria,
        descricao: { equals: descricao, mode: 'insensitive' },
      },
    });
  }

 async buscarAulasDoEstudante(estudanteId: string): Promise<AulaAgenda[]> {
    return this.prisma.client.aula.findMany({
      where: {
        OR: [
         { estudanteId: estudanteId }, 
         { turma: { estudantes: { some: { id: estudanteId } } } }
        ]
      },
      include: {
        area: true,
        educador: true,
      },
    });
  }

  async criarEspecificidade(dados: { tipo: TipoEspecificidade; categoria: CategoriaEspecificidade; descricao: string }): Promise<Especificidade> {
    return this.prisma.client.especificidade.create({
      data: dados,
    });
  }

  async buscarVinculoEspecificidade(estudanteId: string, especificidadeId: number): Promise<EstudanteEspecificidade | null> {
    return this.prisma.client.estudanteEspecificidade.findUnique({
      where: { estudanteId_especificidadeId: { estudanteId, especificidadeId } },
    });
  }

  async criarVinculoEspecificidade(estudanteId: string, especificidadeId: number, obsReacao: string): Promise<EstudanteEspecificidade> {
    return this.prisma.client.estudanteEspecificidade.create({
      data: {
        estudanteId,
        especificidadeId,
        obsReacao,
      },
    });
  }

  async atualizarVinculoEspecificidade(estudanteId: string, especificidadeId: number, obsReacao: string): Promise<EstudanteEspecificidade> {
    return this.prisma.client.estudanteEspecificidade.update({
      where: { estudanteId_especificidadeId: { estudanteId, especificidadeId } },
      data: { obsReacao },
    });
  }

  async atualizarReferenciaVinculoEspecificidade(estudanteId: string, especificidadeIdAntiga: number, especificidadeIdNova: number, obsReacao: string): Promise<EstudanteEspecificidade> {
    await this.prisma.client.estudanteEspecificidade.delete({
      where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: especificidadeIdAntiga } },
    });
    return this.prisma.client.estudanteEspecificidade.update({
      where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: especificidadeIdNova } },
      data: { obsReacao },
    });
  }

  async removerVinculoEspecificidade(estudanteId: string, especificidadeId: number): Promise<EstudanteEspecificidade> {
    return this.prisma.client.estudanteEspecificidade.delete({
      where: {
        estudanteId_especificidadeId: { estudanteId, especificidadeId },
      },
    });
  }

  async contarVinculosEspecificidade(especificidadeId: number): Promise<number> {
    return this.prisma.client.estudanteEspecificidade.count({
      where: { especificidadeId },
    });
  }

  async removerEspecificidade(especificidadeId: number): Promise<void> {
    await this.prisma.client.especificidade.delete({
      where: { id: especificidadeId },
    });
  }

  async criarLaudoEDocumento(estudanteId: string, dados: {
    tipoDiagnostico: string;
    tipoDocumento: string;
    dataEmissao: string;
    linkArquivo: string;
  }) {
    
    // 1. Busca ou cria o Diagnóstico Base
    let diagnosticoBase = await this.prisma.client.diagnostico.findFirst({
      where: { tipo: dados.tipoDiagnostico as any }
    });

    if (!diagnosticoBase) {
      diagnosticoBase = await this.prisma.client.diagnostico.create({
        data: {
          nome: dados.tipoDiagnostico, 
          descricao: '',
          tipo: dados.tipoDiagnostico as any, 
        },
      });
    }

    // 2. Cria o vínculo novo OU atualiza o vínculo existente (UPSERT)
    return this.prisma.client.estudanteDiagnostico.upsert({
      where: {
        // Usa a chave composta para encontrar a relação única
        estudanteId_diagnosticoId: {
          estudanteId,
          diagnosticoId: diagnosticoBase.id,
        }
      },
      update: {
        // Se o aluno já tem o diagnóstico, apenas joga o arquivo novo lá dentro!
        documentos: {
          create: {
            tipo: dados.tipoDocumento as any,
            arquivo: dados.linkArquivo, 
            dataEmissao: new Date(dados.dataEmissao)
          }
        }
      },
      create: {
        // Se o aluno NÃO tem o diagnóstico, cria a relação e já insere o arquivo!
        estudanteId,
        diagnosticoId: diagnosticoBase.id,
        documentos: {
          create: {
            tipo: dados.tipoDocumento as any,
            arquivo: dados.linkArquivo, 
            dataEmissao: new Date(dados.dataEmissao)
          }
        }
      }
    });
  }

  async deletarDocumento(documentoId: string) {
    return this.prisma.client.documentoDiagnostico.delete({
      where: { id: documentoId }
    });
  }

  async atualizarDocumento(documentoId: string, dados: {
    tipoDocumento: string;
    dataEmissao: string;
    linkArquivo?: string;
  }) {
    return this.prisma.client.documentoDiagnostico.update({
      where: { id: documentoId },
      data: {
        tipo: dados.tipoDocumento as any,
        dataEmissao: new Date(dados.dataEmissao),
        ...(dados.linkArquivo && { arquivo: dados.linkArquivo })
      }
    });
  }

  async buscarMedicamentoPorNome(nome: string) {
    // Usamos 'insensitive' para evitar duplicar "Ritalina" e "ritalina"
    return this.prisma.client.medicamento.findFirst({
      where: { nome: { equals: nome, mode: 'insensitive' } },
    });
  }

  async buscarMedicamentoPorId(id: number) {
    return this.prisma.client.medicamento.findUnique({
      where: { id },
    });
  }

  async criarMedicamento(nome: string) {
    return this.prisma.client.medicamento.create({
      data: { nome },
    });
  }

  async criarVinculoMedicamento(dados: {
    estudanteId: string;
    medicamentoId: number;
    dosagem: number;
    unidadeMedida: UnidadeM; 
    administradoEscola: boolean;
    intervaloAdministracao: number;
    horarioAdministrado: Date;
  }) {
    return this.prisma.client.estudanteMedicamento.create({
      data: dados,
    });
  }

  async atualizarVinculoMedicamento(
    estudanteId: string,
    medicamentoId: number,
    dados: {
      dosagem: number;
      unidadeMedida: any;
      administradoEscola: boolean;
      intervaloAdministracao: number;
      horarioAdministrado: Date;
    }
  ) {
    return this.prisma.client.estudanteMedicamento.update({
      where: {
        estudanteId_medicamentoId: { estudanteId, medicamentoId },
      },
      data: dados,
    });
  }

  async removerVinculoMedicamento(estudanteId: string, medicamentoId: number) {
    return this.prisma.client.estudanteMedicamento.delete({
      where: {
        estudanteId_medicamentoId: { estudanteId, medicamentoId },
      },
    });
  }
}
