import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import type { IEstudanteRepositorio, EstudanteVisaoGeral, EstudanteSaude, EstudantePedagogico } from './interfaces/IEstudanteRepositorio.js';
import { EspecificidadeDto } from './dtos/create.especifidades.dto.js';

@Injectable()
export class EstudanteService {
  constructor(
    @Inject('IEstudanteRepositorio')
    private readonly estudanteRepositorio: IEstudanteRepositorio,
  ) {}

  async getVisaoGeral(estudanteId: string) {
    const estudante = await this.estudanteRepositorio.buscarVisaoGeral(estudanteId);

    if (!estudante) {
      throw new NotFoundException('Estudante não encontrado.');
    }

    return this.mapearRetornoVisaoGeral(estudante);
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

      especificidades: dados.especificidades?.map((e) => ({
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
        }))
      ),

      medicamentos: dados.medicamentos.map((m) => ({
        nome: m.medicamento.nome,
        dosagem: `${m.dosagem} ${m.unidadeMedida}`,
        horarioAdministrado: m.horarioAdministrado,
        administradoEscola: m.administradoEscola,
      })),
    };
  }


  async getPedagogico(estudanteId: string) {
    const estudante = await this.estudanteRepositorio.buscarPedagogico(estudanteId);

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
    let especificidade = await this.estudanteRepositorio.buscarEspecificidadeExata(
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
        // Outra requisição concurrent criou o mesmo registro — buscamos novamente
        const existente = await this.estudanteRepositorio.buscarEspecificidadeExata(
          dto.tipo,
          dto.categoria,
          dto.descricao,
        );
        if (!existente) throw new Error('Falha ao criar ou localizar especificidade.');
        especificidade = existente;
      }
    }

    const vinculoExistente = await this.estudanteRepositorio.buscarVinculoEspecificidade(estudanteId, especificidade.id);

    if (vinculoExistente) {
      return this.estudanteRepositorio.atualizarVinculoEspecificidade(estudanteId, especificidade.id, dto.observacao ?? '');
    }

    return this.estudanteRepositorio.criarVinculoEspecificidade(estudanteId, especificidade.id, dto.observacao ?? '');
  }

  async updateEspecificidade(estudanteId: string, especificidadeIdAntiga: number, dto: EspecificidadeDto) {
    let novaEspecificidade = await this.estudanteRepositorio.buscarEspecificidadeExata(
      dto.tipo,
      dto.categoria,
      dto.descricao
    );

    if (!novaEspecificidade) {
      novaEspecificidade = await this.estudanteRepositorio.criarEspecificidade({
        tipo: dto.tipo,
        categoria: dto.categoria,
        descricao: dto.descricao,
      });
    }

    if (novaEspecificidade.id !== especificidadeIdAntiga) {
      const jaTemNova = await this.estudanteRepositorio.buscarVinculoEspecificidade(estudanteId, novaEspecificidade.id);

      if (jaTemNova) {
        await this.estudanteRepositorio.removerVinculoEspecificidade(estudanteId, especificidadeIdAntiga);
        return this.estudanteRepositorio.atualizarVinculoEspecificidade(estudanteId, novaEspecificidade.id, dto.observacao ?? '');
      } else {
        return this.estudanteRepositorio.atualizarReferenciaVinculoEspecificidade(estudanteId, especificidadeIdAntiga, novaEspecificidade.id, dto.observacao ?? '');
      }
    } else {
      return this.estudanteRepositorio.atualizarVinculoEspecificidade(estudanteId, especificidadeIdAntiga, dto.observacao ?? '');
    }
  }

  async deleteEspecificidade(estudanteId: string, especificidadeId: number) {
    const deletedVinculo = await this.estudanteRepositorio.removerVinculoEspecificidade(estudanteId, especificidadeId);

    const count = await this.estudanteRepositorio.contarVinculosEspecificidade(especificidadeId);

    if (count === 0) {
      await this.estudanteRepositorio.removerEspecificidade(especificidadeId);
    }

    return deletedVinculo;
  }
}