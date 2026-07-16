import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type {
  IEstudanteRepositorio,
  EstudanteVisaoGeral,
  EstudanteSaude,
  EstudantePedagogico,
  EstudanteListagemPaginado,
  AulaAgenda,
} from './interfaces/IEstudanteRepositorio.js';
import {
  Especificidade,
  EstudanteEspecificidade,
  TipoEspecificidade,
  CategoriaEspecificidade,
  TipoDiagnostico,
  UnidadeM,
  RegistroAula
} from '@prisma-client';
import type { BuscarEstudantesQueryDto } from './dtos/buscar-estudantes-query.dto.js';
import type { CreateRegistroAulaBatchDto } from './dtos/create-registro-aula.dto.js';

@Injectable()
export class EstudanteRepository implements IEstudanteRepositorio {
  constructor(private prisma: PrismaService) {}

  async criarEstudante(dados: any): Promise<any> {
    return this.prisma.client.estudante.create({
      data: dados,
    });
  }

  async atualizarEstudante(id: string, payload: { estudante: any, responsavel: any }): Promise<any> {
    return this.prisma.client.$transaction(async (tx) => {
      // 1. Atualiza os dados do estudante
      const estudanteAtualizado = await tx.estudante.update({
        where: { id },
        data: payload.estudante,
      });

      // 2. Se houver dados do responsável, atualizar ou criar
      if (payload.responsavel) {
        // Verifica se já existe um responsável principal
        const relacaoPrincipal = await tx.estudanteResponsavel.findFirst({
          where: {
            estudanteId: id,
            responsavelPrincipal: true,
          },
          include: {
            responsavel: true,
          },
        });

        if (relacaoPrincipal) {
          // Se existe, atualiza os dados do responsável
          await tx.responsavel.update({
            where: { id: relacaoPrincipal.responsavelId },
            data: payload.responsavel,
          });
        } else {
          // Se não existe, cria um novo responsável e o vínculo principal
          const novoResponsavel = await tx.responsavel.create({
            data: {
              ...payload.responsavel,
              cpf: payload.responsavel.cpf || (Date.now().toString() + Math.floor(Math.random() * 1000)),
              sexo: payload.responsavel.sexo || 'PREFIRO_NAO_INFORMAR',
              bairro: payload.responsavel.bairro || 'Não informado'
            },
          });

          await tx.estudanteResponsavel.create({
            data: {
              estudanteId: id,
              responsavelId: novoResponsavel.id,
              responsavelPrincipal: true,
              grauParentesco: 'OUTRO', // Valor default obrigatório pelo schema
            },
          });
        }
      }

      return estudanteAtualizado;
    });
  }

  async buscarVisaoGeral(
    estudanteId: string,
  ): Promise<EstudanteVisaoGeral | null> {
    return this.prisma.client.estudante.findFirst({
      where: { id: estudanteId, deletedAt: null },
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
    return this.prisma.client.estudante.findFirst({
      where: { id: estudanteId, deletedAt: null },
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

  async buscarPedagogico(
    estudanteId: string,
  ): Promise<EstudantePedagogico | null> {
    return this.prisma.client.estudante.findFirst({
      where: { id: estudanteId, deletedAt: null },
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

  async buscarComFiltros(
    query: BuscarEstudantesQueryDto,
  ): Promise<EstudanteListagemPaginado> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Calcula datas de corte para filtro de idade
    const agora = new Date();
    const dataMaxNasc = query.idadeMin !== undefined
      ? new Date(agora.getFullYear() - query.idadeMin, agora.getMonth(), agora.getDate())
      : undefined;
    const dataMinNasc = query.idadeMax !== undefined
      ? new Date(agora.getFullYear() - query.idadeMax - 1, agora.getMonth(), agora.getDate() + 1)
      : undefined;

    const where = {
      deletedAt: null,
      ...(query.nome && {
        nomeCompleto: { startsWith: query.nome, mode: 'insensitive' as const },
      }),
      ...(query.matricula && {
        matricula: { contains: query.matricula, mode: 'insensitive' as const },
      }),
      ...(query.diagnosticoTipo && {
        diagnosticos: {
          some: {
            diagnostico: {
              // O front-end exibe os diagnósticos com espaço (ex: "SINDROME DOWN")
              // para padronização visual, mas o enum do Prisma usa underscore.
              tipo: query.diagnosticoTipo.trim().replace(/\s+/g, '_').toUpperCase() as TipoDiagnostico,
            },
          },
        },
      }),
      ...(query.status && {
        statusMatricula: query.status === 'PENDENTE' ? false : true,
      }),
      ...(query.sexo && { sexo: query.sexo }),
      ...(query.turmaId && {
        turmas: { some: { id: query.turmaId } },
      }),
      ...(query.formaComunicacao && { formaComunicacao: query.formaComunicacao }),
      ...(query.categoriaEspecificidade && {
        especificidades: {
          some: {
            especificidade: { categoria: query.categoriaEspecificidade },
          },
        },
      }),
      ...((dataMinNasc || dataMaxNasc) && {
        dataNascimento: {
          ...(dataMinNasc && { gte: dataMinNasc }),
          ...(dataMaxNasc && { lte: dataMaxNasc }),
        },
      }),
    };

    const select = {
      id: true,
      nomeCompleto: true,
      matricula: true,
      foto: true,
      statusMatricula: true,
      dataNascimento: true,
      sexo: true,
      formaComunicacao: true,
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
      this.prisma.client.estudante.findMany({
        where,
        select,
        skip,
        take: limit,
        orderBy: { nomeCompleto: 'asc' },
      }),
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

  /**
   * Verifica se o estudante já possui um vínculo de especificidade com o mesmo tipo + categoria.
   * Usado para prevenir duplicatas (ex: dois Gatilhos Sensoriais para o mesmo aluno).
   * Se `excluirEspecificidadeId` for informado, ignora aquele vínculo (útil no update).
   */
  async buscarVinculoPorTipoCategoria(
    estudanteId: string,
    tipo: TipoEspecificidade,
    categoria: CategoriaEspecificidade,
    excluirEspecificidadeId?: number,
  ): Promise<EstudanteEspecificidade | null> {
    return this.prisma.client.estudanteEspecificidade.findFirst({
      where: {
        estudanteId,
        especificidade: { tipo, categoria },
        ...(excluirEspecificidadeId !== undefined
          ? { NOT: { especificidadeId: excluirEspecificidadeId } }
          : {}),
      },
    });
  }

  async buscarAulasDoEstudante(estudanteId: string): Promise<AulaAgenda[]> {
    return this.prisma.client.aula.findMany({
      where: {
        OR: [
          { estudanteId: estudanteId },
          { turma: { estudantes: { some: { id: estudanteId } } } },
        ],
      },
      include: {
        area: true,
        educador: true,
      },
    });
  }

  async criarEspecificidade(dados: {
    tipo: TipoEspecificidade;
    categoria: CategoriaEspecificidade;
    descricao: string;
  }): Promise<Especificidade> {
    return this.prisma.client.especificidade.create({
      data: dados,
    });
  }

  async buscarVinculoEspecificidade(
    estudanteId: string,
    especificidadeId: number,
  ): Promise<EstudanteEspecificidade | null> {
    return this.prisma.client.estudanteEspecificidade.findUnique({
      where: {
        estudanteId_especificidadeId: { estudanteId, especificidadeId },
      },
    });
  }

  async criarVinculoEspecificidade(
    estudanteId: string,
    especificidadeId: number,
    obsReacao: string,
  ): Promise<EstudanteEspecificidade> {
    return this.prisma.client.estudanteEspecificidade.create({
      data: {
        estudanteId,
        especificidadeId,
        obsReacao,
      },
    });
  }

  async atualizarVinculoEspecificidade(
    estudanteId: string,
    especificidadeId: number,
    obsReacao: string,
  ): Promise<EstudanteEspecificidade> {
    return this.prisma.client.estudanteEspecificidade.update({
      where: {
        estudanteId_especificidadeId: { estudanteId, especificidadeId },
      },
      data: { obsReacao },
    });
  }

  async atualizarReferenciaVinculoEspecificidade(
    estudanteId: string,
    especificidadeIdAntiga: number,
    especificidadeIdNova: number,
    obsReacao: string,
  ): Promise<EstudanteEspecificidade> {
    await this.prisma.client.estudanteEspecificidade.delete({
      where: {
        estudanteId_especificidadeId: {
          estudanteId,
          especificidadeId: especificidadeIdAntiga,
        },
      },
    });
    return this.prisma.client.estudanteEspecificidade.update({
      where: {
        estudanteId_especificidadeId: {
          estudanteId,
          especificidadeId: especificidadeIdNova,
        },
      },
      data: { obsReacao },
    });
  }

  async removerVinculoEspecificidade(
    estudanteId: string,
    especificidadeId: number,
  ): Promise<EstudanteEspecificidade> {
    return this.prisma.client.estudanteEspecificidade.delete({
      where: {
        estudanteId_especificidadeId: { estudanteId, especificidadeId },
      },
    });
  }

  async contarVinculosEspecificidade(
    especificidadeId: number,
  ): Promise<number> {
    return this.prisma.client.estudanteEspecificidade.count({
      where: { especificidadeId },
    });
  }

  async removerEspecificidade(especificidadeId: number): Promise<void> {
    await this.prisma.client.especificidade.delete({
      where: { id: especificidadeId },
    });
  }

  async criarLaudoEDocumento(
    estudanteId: string,
    dados: {
      tipoDiagnostico: string;
      tipoDocumento: string;
      dataEmissao: string;
      linkArquivo: string;
    },
  ) {
    // 1. Busca ou cria o Diagnóstico Base
    let diagnosticoBase = await this.prisma.client.diagnostico.findFirst({
      where: { tipo: dados.tipoDiagnostico as any },
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
        },
      },
      update: {
        // Se o aluno já tem o diagnóstico, apenas joga o arquivo novo lá dentro!
        documentos: {
          create: {
            tipo: dados.tipoDocumento as any,
            arquivo: dados.linkArquivo,
            dataEmissao: new Date(dados.dataEmissao),
          },
        },
      },
      create: {
        // Se o aluno NÃO tem o diagnóstico, cria a relação e já insere o arquivo!
        estudanteId,
        diagnosticoId: diagnosticoBase.id,
        documentos: {
          create: {
            tipo: dados.tipoDocumento as any,
            arquivo: dados.linkArquivo,
            dataEmissao: new Date(dados.dataEmissao),
          },
        },
      },
    });
  }

  async deletarDocumento(documentoId: string) {
    return this.prisma.client.documentoDiagnostico.delete({
      where: { id: documentoId },
    });
  }

  async atualizarLaudo(
    documentoId: string,
    dados: any,
    urlArquivo?: string,
  ) {
    return this.atualizarDocumento(documentoId, {
      tipoDocumento: dados.tipoDocumento || 'LAUDO_MEDICO',
      dataEmissao: dados.dataEmissao,
      linkArquivo: urlArquivo,
    });
  }

  async atualizarDocumento(
    documentoId: string,
    dados: {
      tipoDocumento: string;
      dataEmissao: string;
      linkArquivo?: string;
    },
  ) {
    return this.prisma.client.documentoDiagnostico.update({
      where: { id: documentoId },
      data: {
        tipo: dados.tipoDocumento as any,
        dataEmissao: new Date(dados.dataEmissao),
        ...(dados.linkArquivo && { arquivo: dados.linkArquivo }),
      },
    });
  }

  async atualizarLaudoCompleto(
    estudanteId: string,
    documentoId: string,
    dados: {
      tipoDiagnostico: string;
      tipoDocumento: string;
      dataEmissao: string;
      linkArquivo?: string;
    },
  ) {
    // 1. Find or create the DiagnosticoBase for the NEW tipoDiagnostico
    let diagnosticoBase = await this.prisma.client.diagnostico.findFirst({
      where: { tipo: dados.tipoDiagnostico as any },
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

    // 2. Ensure EstudanteDiagnostico exists
    await this.prisma.client.estudanteDiagnostico.upsert({
      where: {
        estudanteId_diagnosticoId: {
          estudanteId,
          diagnosticoId: diagnosticoBase.id,
        },
      },
      update: {},
      create: {
        estudanteId,
        diagnosticoId: diagnosticoBase.id,
      },
    });

    // 3. Update the DocumentoDiagnostico to point to the new diagnosticoId
    const updated = await this.prisma.client.documentoDiagnostico.update({
      where: { id: documentoId },
      data: {
        tipo: dados.tipoDocumento as any,
        dataEmissao: new Date(dados.dataEmissao),
        diagnosticoId: diagnosticoBase.id,
        ...(dados.linkArquivo && { arquivo: dados.linkArquivo }),
      },
    });

    // 4. CLEANUP: Remove any EstudanteDiagnostico for this student that has no documents left
    await this.prisma.client.estudanteDiagnostico.deleteMany({
      where: {
        estudanteId: estudanteId,
        documentos: { none: {} },
      },
    });

    return updated;
  }

  async criarAula(estudanteId: string, dto: any) {
    const [inicioHora, inicioMinuto] = dto.horarioInicio.split(':').map(Number);
    const horarioInicio = new Date(Date.UTC(1970, 0, 1, inicioHora, inicioMinuto));

    const [fimHora, fimMinuto] = dto.horarioFim.split(':').map(Number);
    const horarioFim = new Date(Date.UTC(1970, 0, 1, fimHora, fimMinuto));

    return this.prisma.client.aula.create({
      data: {
        estudanteId,
        educadorId: dto.educadorId,
        titulo: dto.nome || null,
        areaId: dto.areaId || null,
        diaSemana: dto.diaSemana,
        horarioInicio,
        horarioFim,
        isEvento: false,
      },
      include: {
        educador: true,
        area: true,
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
  }) {
    return this.prisma.client.estudanteMedicamento.create({
      data: {
        estudanteId: dados.estudanteId,
        medicamentoId: dados.medicamentoId,
        dosagem: dados.dosagem,
        unidadeMedida: dados.unidadeMedida,
        administradoEscola: false,
        intervaloAdministracao: null,
        horarioAdministrado: null
      },
    });
  }

  async atualizarVinculoMedicamento(
    estudanteId: string,
    medicamentoId: number,
    dados: {
      dosagem: number;
      unidadeMedida: UnidadeM;
    },
  ) {
    return this.prisma.client.estudanteMedicamento.update({
      where: {
        estudanteId_medicamentoId: { estudanteId, medicamentoId },
      },
      data: {
        dosagem: dados.dosagem,
        unidadeMedida: dados.unidadeMedida,
        administradoEscola: false,
        intervaloAdministracao: null,
        horarioAdministrado: null
      },
    });
  }

  async removerVinculoMedicamento(
    estudanteId: string,
    medicamentoId: number,
  ) {
    return this.prisma.client.estudanteMedicamento.delete({
      where: {
        estudanteId_medicamentoId: { estudanteId, medicamentoId },
      },
    });
  }

  async registrarChamadaEmLote(dto: CreateRegistroAulaBatchDto): Promise<RegistroAula[]> {
    const dataChamada = new Date(dto.dataAula);

    return this.prisma.client.$transaction(
      dto.estudantes.map((estudante) =>
        this.prisma.client.registroAula.create({
          data: {
            aulaId: dto.aulaId,
            estudanteId: estudante.estudanteId,
            data: dataChamada,
            status_aula: dto.statusAula,
            presenca: dto.statusAula === 'REALIZADA' ? estudante.presente : false,
            scoreParticipacao: dto.statusAula === 'REALIZADA' ? estudante.scoreParticipacao : null,
            scoreSuporte: dto.statusAula === 'REALIZADA' ? estudante.scoreNivelSuporte : null,
          },
        })
      )
    );
  }

  async desativarEstudante(id: string): Promise<any> {
    return this.prisma.client.estudante.update({
      where: { id },
      data: { statusMatricula: false },
    });
  }
}
