import { Injectable, NotFoundException, Inject, BadRequestException } from '@nestjs/common';
import type {
  IEstudanteRepositorio,
  EstudanteVisaoGeral,
  EstudanteSaude,
  EstudantePedagogico,
} from './interfaces/IEstudanteRepositorio.js';
import { EspecificidadeDto } from './dtos/create.especifidades.dto.js';
import { DiaSemana, StatusAula } from '../../../../../infra/generated/prisma';
import { ObterAgendaSemanaDto } from './dtos/obter-agenda-semana.dto.js';
import type { BuscarEstudantesQueryDto } from './dtos/buscar-estudantes-query.dto.js';
import { CreateRegistroAulaBatchDto } from './dtos/create-registro-aula.dto.js';
import { CreateAulaEstudanteDto } from './dtos/create-aula.dto.js';

@Injectable()
export class EstudanteService {
  constructor(
    @Inject('IEstudanteRepositorio')
    private readonly estudanteRepositorio: IEstudanteRepositorio,
  ) {}

  async adicionarAula(estudanteId: string, dto: CreateAulaEstudanteDto) {
    return this.estudanteRepositorio.criarAula(estudanteId, dto);
  }

  async getVisaoGeral(estudanteId: string) {
    const estudante =
      await this.estudanteRepositorio.buscarVisaoGeral(estudanteId);

    if (!estudante) {
      throw new NotFoundException('Estudante não encontrado.');
    }

    return this.mapearRetornoVisaoGeral(estudante);
  }

  /**
   * Lista todos os estudantes com filtros opcionais e paginação.
   * Utilizado pela Tela 4 (Gerenciamento Geral de Alunos).
   */
  async buscarTodos(query: BuscarEstudantesQueryDto) {
    return this.estudanteRepositorio.buscarComFiltros(query);
  }

  private mapearRetornoVisaoGeral(dados: EstudanteVisaoGeral) {
    const turma = dados.turmas?.[0];
    const responsavelPrincipal = dados.responsaveis?.[0]?.responsavel;

    return {
      id: dados.id,
      nomeCompleto: dados.nomeCompleto,
      dataNascimento: dados.dataNascimento,
      cpf: dados.cpf ? `***.***.${dados.cpf.slice(-6)}` : null,
      sexo: dados.sexo,
      formaComunicacao: dados.formaComunicacao,
      foto: dados.foto,

      turma: turma
        ? {
            nome: turma.nome,
            turno: turma.turno,
            anoLetivo: turma.anoLetivo,
            etapa: turma.etapa,
          }
        : null,

      professorRegente: turma?.educador
        ? {
            nomeCompleto: turma.educador.nome,
          }
        : null,

      responsavel: responsavelPrincipal
        ? {
            nomeCompleto: responsavelPrincipal.nomeCompleto,
            telefone: responsavelPrincipal.telefone,
            email: responsavelPrincipal.email,
            endereco: responsavelPrincipal.endereco,
          }
        : null,

      especificidades:
        dados.especificidades?.map((e) => ({
          especificidadeId: e.especificidadeId,
          categoria: e.especificidade.categoria,
          tipo: e.especificidade.tipo,
          descricao: e.especificidade.descricao,
          observacao: e.obsReacao,
        })) || [],
    };
  }

  async getSaude(estudanteId: string) {
    const dadosSaude = await this.estudanteRepositorio.buscarSaude(estudanteId);

    if (!dadosSaude) {
      throw new NotFoundException('Estudante não encontrado.');
    }

    return this.mapearRetornoSaude(dadosSaude);
  }

  private mapearRetornoSaude(dados: EstudanteSaude) {
    return {
      estudanteId: dados.id,
      nomeCompleto: dados.nomeCompleto,

      especificidades: dados.especificidades.map((e) => ({
        especificidadeId: e.especificidadeId,
        descricao: e.especificidade.descricao,
        categoria: e.especificidade.categoria,
        tipo: e.especificidade.tipo,
        observacao: e.obsReacao,
      })),

      laudos: dados.diagnosticos.flatMap((d) =>
        d.documentos.map((doc) => ({
          id: doc.id,
          diagnostico: d.diagnostico.nome,
          tipo: doc.tipo,
          urlArquivo: doc.arquivo,
          dataEmissao: doc.dataEmissao,
          createdAt: doc.createdAt,
        })),
      ),

      medicamentos: dados.medicamentos.map((m) => ({
        medicamentoId: m.medicamentoId,
        nome: m.medicamento.nome,
        dosagem: m.dosagem,
        unidadeMedida: m.unidadeMedida,
        intervaloAdministracao: m.intervaloAdministracao,
        horarioAdministrado: m.horarioAdministrado,
        administradoEscola: m.administradoEscola,
      })),
    };
  }

  async getPedagogico(estudanteId: string) {
    const estudante =
      await this.estudanteRepositorio.buscarPedagogico(estudanteId);

    if (!estudante) {
      throw new NotFoundException('Estudante não encontrado.');
    }

    return this.mapearRetornoPedagogico(estudante);
  }

  private mapearRetornoPedagogico(dados: EstudantePedagogico) {
    return {
      estudanteId: dados.id,
      nomeCompleto: dados.nomeCompleto,
      relatorios: dados.relatoriosSemestrais.map((rel) => ({
        id: rel.id,
        semestre: rel.semestre,
        ano: rel.ano,
        parecerGlobalDesenvolvimento: rel.parecerGlobalDesenvolvimento,
        status: rel.status,
        dataFechamento: rel.dataFechamento,
        metas: rel.metas.map((meta) => ({
          id: meta.id,
          descricao: meta.descricao,
          eixoDesenvolvimento: meta.eixoDesenvolvimento,
          scoreFinal: meta.scoreFinal,
          parecer: meta.parecer,
          pibis: meta.pibis.map((pibi) => ({
            id: pibi.id,
            bimestre: pibi.bimestre,
            status: pibi.status,
            scoreAtingibilidade: pibi.scoreAtingibilidade,
            parecerEvolutivo: pibi.parecerEvolutivo,
            criadoEm: pibi.createdAt,
          })),
        })),
      })),
    };
  }

  async createEspecificidade(estudanteId: string, dto: EspecificidadeDto) {
    let especificidade =
      await this.estudanteRepositorio.buscarEspecificidadeExata(
        dto.tipo,
        dto.categoria,
        dto.descricao,
      );

    if (!especificidade) {
      try {
        especificidade = await this.estudanteRepositorio.criarEspecificidade({
          tipo: dto.tipo,
          categoria: dto.categoria,
          descricao: dto.descricao,
        });
      } catch {
        const existente =
          await this.estudanteRepositorio.buscarEspecificidadeExata(
            dto.tipo,
            dto.categoria,
            dto.descricao,
          );
        if (!existente)
          throw new Error('Falha ao criar ou localizar especificidade.');
        especificidade = existente;
      }
    }

    const vinculoExistente =
      await this.estudanteRepositorio.buscarVinculoEspecificidade(
        estudanteId,
        especificidade.id,
      );

    if (vinculoExistente) {
      return this.estudanteRepositorio.atualizarVinculoEspecificidade(
        estudanteId,
        especificidade.id,
        dto.observacao ?? '',
      );
    }

    return this.estudanteRepositorio.criarVinculoEspecificidade(
      estudanteId,
      especificidade.id,
      dto.observacao ?? '',
    );
  }

  async updateEspecificidade(
    estudanteId: string,
    especificidadeIdAntiga: number,
    dto: EspecificidadeDto,
  ) {
    let novaEspecificidade =
      await this.estudanteRepositorio.buscarEspecificidadeExata(
        dto.tipo,
        dto.categoria,
        dto.descricao,
      );

    if (!novaEspecificidade) {
      novaEspecificidade = await this.estudanteRepositorio.criarEspecificidade({
        tipo: dto.tipo,
        categoria: dto.categoria,
        descricao: dto.descricao,
      });
    }

    if (novaEspecificidade.id !== especificidadeIdAntiga) {
      const jaTemNova =
        await this.estudanteRepositorio.buscarVinculoEspecificidade(
          estudanteId,
          novaEspecificidade.id,
        );

      if (jaTemNova) {
        await this.estudanteRepositorio.removerVinculoEspecificidade(
          estudanteId,
          especificidadeIdAntiga,
        );
        return this.estudanteRepositorio.atualizarVinculoEspecificidade(
          estudanteId,
          novaEspecificidade.id,
          dto.observacao ?? '',
        );
      } else {
        return this.estudanteRepositorio.atualizarReferenciaVinculoEspecificidade(
          estudanteId,
          especificidadeIdAntiga,
          novaEspecificidade.id,
          dto.observacao ?? '',
        );
      }
    } else {
      return this.estudanteRepositorio.atualizarVinculoEspecificidade(
        estudanteId,
        especificidadeIdAntiga,
        dto.observacao ?? '',
      );
    }
  }

  async deleteEspecificidade(estudanteId: string, especificidadeId: number) {
    const deletedVinculo =
      await this.estudanteRepositorio.removerVinculoEspecificidade(
        estudanteId,
        especificidadeId,
      );

    const count =
      await this.estudanteRepositorio.contarVinculosEspecificidade(
        especificidadeId,
      );

    if (count === 0) {
      await this.estudanteRepositorio.removerEspecificidade(especificidadeId);
    }

    return deletedVinculo;
  }

  async obterAgendaSemana(estudanteId: string, dto: ObterAgendaSemanaDto) {
    const aulasRecorrentes =
      await this.estudanteRepositorio.buscarAulasDoEstudante(estudanteId);

    const [ano, mes, dia] = dto.dataBase.split('-').map(Number) as [
      number,
      number,
      number,
    ];
    const dataBase = new Date(ano, mes - 1, dia);

    const diaSemanaJs = dataBase.getDay();
    const diffParaSegunda =
      dataBase.getDate() - diaSemanaJs + (diaSemanaJs === 0 ? -6 : 1);

    const nomesDiasUI = [
      'DOMINGO',
      'SEGUNDA',
      'TERÇA',
      'QUARTA',
      'QUINTA',
      'SEXTA',
      'SÁBADO',
    ];
    const mapaDiasPrisma = [
      null,
      DiaSemana.SEGUNDA,
      DiaSemana.TERCA,
      DiaSemana.QUARTA,
      DiaSemana.QUINTA,
      DiaSemana.SEXTA,
      null,
    ];

    const agendaDaSemana = [];

    for (let i = 0; i < 7; i++) {
      const dataAtual = new Date(ano, mes - 1, diffParaSegunda + i);

      const diaJs = dataAtual.getDay();
      const diaPrismaAtual = mapaDiasPrisma[diaJs];

      const dataFormatada = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}-${String(dataAtual.getDate()).padStart(2, '0')}`;

      const aulasDoDia = diaPrismaAtual
        ? aulasRecorrentes.filter((aula) => aula.diaSemana === diaPrismaAtual)
        : [];

      agendaDaSemana.push({
        data: dataFormatada,
        diaSemana: nomesDiasUI[diaJs],
        eventos: aulasDoDia.map((aula) => ({
          aulaId: aula.id,
          titulo: aula.titulo || aula.area?.nome || 'Regência',
          educador: aula.educador?.nome || 'Não definido',
          horarioInicio: this.formatTimeOnly(aula.horarioInicio),
          horarioFim: this.formatTimeOnly(aula.horarioFim),
          tipoVisual: aula.area ? 'especializado' : 'regencia',
        })),
      });
    }

    return agendaDaSemana;
  }

  async adicionarLaudo(
    estudanteId: string,
    dados: any,
    arquivo: Express.Multer.File,
  ) {
    if (!arquivo) {
      throw new Error('Nenhum arquivo foi enviado.');
    }

    const urlLocal = `http://localhost:3000/api/v1/uploads/laudos/${arquivo.filename}`;

    return this.estudanteRepositorio.criarLaudoEDocumento(estudanteId, {
      tipoDiagnostico: dados.tipoDiagnostico,
      tipoDocumento: dados.tipoDocumento,
      dataEmissao: dados.dataEmissao,
      linkArquivo: urlLocal,
    });
  }

  async removerLaudo(documentoId: string) {
    return this.estudanteRepositorio.deletarDocumento(documentoId);
  }

  async atualizarLaudo(documentoId: string, dados: any, arquivo?: any) {
    let linkArquivo: string | undefined;

    if (arquivo) {
      linkArquivo = `http://localhost:3000/api/v1/uploads/laudos/${arquivo.filename}`;
    }

    return this.estudanteRepositorio.atualizarDocumento(documentoId, {
      tipoDocumento: dados.tipoDocumento,
      dataEmissao: dados.dataEmissao,
      linkArquivo,
    });
  }

  // Conversão da hora para o formato adequado
  private parseTime(timeStr: string): Date {
    if (!timeStr) return new Date('1970-01-01T00:00:00.000Z');
    return new Date(`1970-01-01T${timeStr}:00.000Z`);
  }

  // Formata Date para string HH:mm (apenas o horário)
  private formatTimeOnly(date: Date | null): string {
    if (!date) return '';
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  async addMedicamento(estudanteId: string, dados: any) {
    let medicamento = await this.estudanteRepositorio.buscarMedicamentoPorNome(
      dados.nomeMedicamento,
    );

    if (!medicamento) {
      medicamento = await this.estudanteRepositorio.criarMedicamento(
        dados.nomeMedicamento,
      );
    }

    return this.estudanteRepositorio.criarVinculoMedicamento({
      estudanteId,
      medicamentoId: medicamento.id,
      dosagem: Number(dados.dosagem),
      unidadeMedida: dados.unidadeMedida,
      administradoEscola: dados.administradoNaEscola,
      intervaloAdministracao: dados.administradoNaEscola
        ? Number(dados.intervaloAdministracao)
        : 0,
      horarioAdministrado:
        dados.administradoNaEscola && dados.horarioAdministracao
          ? this.parseTime(dados.horarioAdministracao)
          : this.parseTime('00:00'),
    });
  }

  async updateMedicamento(
    estudanteId: string,
    medicamentoId: number,
    dados: any,
  ) {
    const medicamentoAtual =
      await this.estudanteRepositorio.buscarMedicamentoPorId(medicamentoId);
    let novoMedicamentoId = medicamentoId;

    if (medicamentoAtual && medicamentoAtual.nome !== dados.nomeMedicamento) {
      let medExistente =
        await this.estudanteRepositorio.buscarMedicamentoPorNome(
          dados.nomeMedicamento,
        );

      if (!medExistente) {
        medExistente = await this.estudanteRepositorio.criarMedicamento(
          dados.nomeMedicamento,
        );
      }
      novoMedicamentoId = medExistente.id;
    }

    // Se o nome do remédio mudou, precisamos recriar o vínculo com o ID novo
    if (novoMedicamentoId !== medicamentoId) {
      await this.estudanteRepositorio.removerVinculoMedicamento(
        estudanteId,
        medicamentoId,
      );
      return this.addMedicamento(estudanteId, dados);
    }

    // Se é o mesmo remédio, só atualiza os dados da relação
    return this.estudanteRepositorio.atualizarVinculoMedicamento(
      estudanteId,
      medicamentoId,
      {
        dosagem: Number(dados.dosagem),
        unidadeMedida: dados.unidadeMedida,
        administradoEscola: dados.administradoNaEscola,
        intervaloAdministracao: dados.administradoNaEscola
          ? Number(dados.intervaloAdministracao)
          : 0,
        horarioAdministrado:
          dados.administradoNaEscola && dados.horarioAdministracao
            ? this.parseTime(dados.horarioAdministracao)
            : this.parseTime('00:00'),
      },
    );
  }

  async removeMedicamento(estudanteId: string, medicamentoId: number) {
    return this.estudanteRepositorio.removerVinculoMedicamento(
      estudanteId,
      medicamentoId,
    );
  }
  async registrarChamadaLote(dto: CreateRegistroAulaBatchDto) {
    if (!dto.estudantes || dto.estudantes.length === 0) {
      throw new BadRequestException('A lista de estudantes para registro não pode estar vazia.');
    }

    if (dto.statusAula !== StatusAula.REALIZADA) {
      dto.estudantes = dto.estudantes.map((estudante) => ({
        ...estudante,
        presente: false,
        scoreParticipacao: undefined,
        scoreNivelSuporte: undefined,
      }));
    }

    return this.estudanteRepositorio.registrarChamadaEmLote(dto);
  }
}
