import { Prisma, EstudanteEspecificidade, Especificidade, TipoEspecificidade, CategoriaEspecificidade, Medicamento, EstudanteMedicamento, UnidadeM, RegistroAula } from '@prisma-client';
import { BuscarEstudantesQueryDto } from '../dtos/buscar-estudantes-query.dto.js';
import { CreateRegistroAulaBatchDto } from '../dtos/create-registro-aula.dto.js';

/** Projeção leve de Estudante usada na listagem geral (Tela 4). */
export type EstudanteListagem = Prisma.EstudanteGetPayload<{
  select: {
    id: true;
    nomeCompleto: true;
    matricula: true;
    foto: true;
    statusMatricula: true;
    dataNascimento: true;
    sexo: true;
    formaComunicacao: true;
    turmas: {
      select: {
        id: true;
        nome: true;
      };
    };
    diagnosticos: {
      select: {
        diagnostico: {
          select: { nome: true; tipo: true };
        };
      };
    };
  };
}>;

/** Resposta paginada para GET /estudantes */
export interface EstudanteListagemPaginado {
  data: EstudanteListagem[];
  total: number;
  page: number;
  limit: number;
  totalPaginas: number;
}


export type EstudanteVisaoGeral = Prisma.EstudanteGetPayload<{
  include: {
    turmas: {
      include: { educador: true };
    };
    responsaveis: {
      where: { responsavelPrincipal: true };
      include: { responsavel: true };
    };
    especificidades: {
      include: { especificidade: true };
    };
  };
}>;

export type EstudanteSaude = Prisma.EstudanteGetPayload<{
  select: {
    id: true;
    nomeCompleto: true;
    especificidades: {
      select: {
        especificidadeId: true;
        obsReacao: true;
        especificidade: {
          select: {
            descricao: true;
            categoria: true;
            tipo: true;
          };
        };
      };
    };
    diagnosticos: {
      select: {
        diagnostico: { select: { nome: true } };
        documentos: {
          select: {
            id: true;
            tipo: true;
            arquivo: true;
            dataEmissao: true;
            createdAt: true;
          };
        };
      };
    };
    medicamentos: {
      select: {
        medicamentoId: true,
        dosagem: true;
        unidadeMedida: true;
        intervaloAdministracao: true,
        horarioAdministrado: true;
        administradoEscola: true;
        medicamento: { select: { nome: true } };
      };
    };
  };
}>;

export type EstudantePedagogico = Prisma.EstudanteGetPayload<{
  select: {
    id: true;
    nomeCompleto: true;
    relatoriosSemestrais: {
      select: {
        id: true;
        semestre: true;
        ano: true;
        parecerGlobalDesenvolvimento: true;
        status: true;
        dataFechamento: true;
        metas: {
          select: {
            id: true;
            descricao: true;
            eixoDesenvolvimento: true;
            scoreFinal: true;
            parecer: true;
            pibis: {
              select: {
                id: true;
                bimestre: true;
                status: true;
                scoreAtingibilidade: true;
                parecerEvolutivo: true;
                createdAt: true;
              };
            };
          };
        };
      };
    };
  };
}>;

export type AulaAgenda = Prisma.AulaGetPayload<{
  include: {
    area: true;
    educador: true;
  }
}>;

export interface IEstudanteRepositorio {
  buscarVisaoGeral(estudanteId: string): Promise<EstudanteVisaoGeral | null>;
  buscarSaude(estudanteId: string): Promise<EstudanteSaude | null>;
  buscarPedagogico(estudanteId: string): Promise<EstudantePedagogico | null>;
  buscarComFiltros(query: BuscarEstudantesQueryDto): Promise<EstudanteListagemPaginado>;
  buscarEspecificidadeExata(tipo: TipoEspecificidade, categoria: CategoriaEspecificidade, descricao: string): Promise<Especificidade | null>;
  criarEspecificidade(dados: { tipo: TipoEspecificidade; categoria: CategoriaEspecificidade; descricao: string }): Promise<Especificidade>;
  buscarVinculoEspecificidade(estudanteId: string, especificidadeId: number): Promise<EstudanteEspecificidade | null>;
  criarVinculoEspecificidade(estudanteId: string, especificidadeId: number, obsReacao: string): Promise<EstudanteEspecificidade>;
  atualizarVinculoEspecificidade(estudanteId: string, especificidadeId: number, obsReacao: string): Promise<EstudanteEspecificidade>;
  atualizarReferenciaVinculoEspecificidade(estudanteId: string, especificidadeIdAntiga: number, especificidadeIdNova: number, obsReacao: string): Promise<EstudanteEspecificidade>;
  removerVinculoEspecificidade(estudanteId: string, especificidadeId: number): Promise<EstudanteEspecificidade>;
  contarVinculosEspecificidade(especificidadeId: number): Promise<number>;
  removerEspecificidade(especificidadeId: number): Promise<void>;
  buscarAulasDoEstudante(estudanteId: string): Promise<AulaAgenda[]>;
   
  buscarMedicamentoPorNome(nome: string): Promise<Medicamento | null>;
  buscarMedicamentoPorId(id: number): Promise<Medicamento | null>;
  criarMedicamento(nome: string): Promise<Medicamento>;
  criarVinculoMedicamento(dados: {
    estudanteId: string;
    medicamentoId: number;
    dosagem: number;
    unidadeMedida: UnidadeM;
    administradoEscola: boolean;
    intervaloAdministracao: number;
    horarioAdministrado: Date;
  }): Promise<EstudanteMedicamento>;
  atualizarVinculoMedicamento(
    estudanteId: string,
    medicamentoId: number,
    dados: {
      dosagem: number;
      unidadeMedida: UnidadeM;
      administradoEscola: boolean;
      intervaloAdministracao: number;
      horarioAdministrado: Date;
    }
  ): Promise<EstudanteMedicamento>;
  removerVinculoMedicamento(estudanteId: string, medicamentoId: number): Promise<EstudanteMedicamento>;
  criarLaudoEDocumento(estudanteId: string, dados: {
    tipoDiagnostico: string;
    tipoDocumento: string;
    dataEmissao: string;
    linkArquivo: string;
  }): Promise<any>;
  deletarDocumento(documentoId: string): Promise<any>;
  atualizarDocumento(documentoId: string, dados: {
    tipoDocumento: string;
    dataEmissao: string;
    linkArquivo?: string;
  }): Promise<any>;
  registrarChamadaEmLote(dto: CreateRegistroAulaBatchDto): Promise<RegistroAula[]>;
}

