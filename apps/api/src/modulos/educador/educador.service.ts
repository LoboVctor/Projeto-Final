import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as Papa from 'papaparse';
import { EducadorRepository, FiltrosEducador, AtualizarEducadorDados, CriarEducadorDados } from './educador.repository.js';
import { TipoEducador } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class EducadorService {
  constructor(
    private readonly educadorRepository: EducadorRepository,
    private readonly prisma: PrismaService,
  ) {}

  async buscarEscolaPadrao() {
    return this.prisma.client.escola.findFirst();
  }

  listar(filtros: FiltrosEducador) {
    return this.educadorRepository.listar(filtros);
  }

  buscarPorId(id: string) {
    return this.educadorRepository.buscarPorId(id);
  }

  async criar(dados: CriarEducadorDados, escolaId: string) {
    // A senha padrão para todo novo usuário é 'Elo@1234'
    const senhaPadrao = 'Elo@1234';
    const hashSenha = await bcrypt.hash(senhaPadrao, 10);

    try {
      return await this.educadorRepository.criar(dados, escolaId, hashSenha);
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Já existe um educador com este CPF, Matrícula ou E-mail.');
      }
      throw error;
    }
  }

  async importarCSV(arquivo: Express.Multer.File, escolaId: string) {
    const csvData = arquivo.buffer.toString('utf-8');
    
    // Configura o papaparse
    const result = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
    });

    if (result.errors.length > 0) {
      throw new BadRequestException('Erro ao processar o CSV: ' + JSON.stringify(result.errors));
    }

    let sucesso = 0;
    let falhas = 0;
    const erros = [];

    // Tenta criar cada linha do CSV
    for (const [index, row] of result.data.entries()) {
      try {
        const rowData = row as any;
        
        if (!rowData.nome || !rowData.email || !rowData.cpf || !rowData.telefone || !rowData.tipo) {
           throw new Error('Campos obrigatórios ausentes: nome, email, cpf, telefone ou tipo.');
        }

        const tipoValido = Object.values(TipoEducador).includes(rowData.tipo as TipoEducador);
        if (!tipoValido) {
           throw new Error(`Tipo de educador inválido: ${rowData.tipo}`);
        }

        const criarDados: CriarEducadorDados = {
          nome: rowData.nome,
          matricula: rowData.matricula || String(Math.floor(Math.random() * 1000000)), // Pode gerar caso falte, ou obrigar
          cpf: rowData.cpf,
          email: rowData.email,
          telefone: rowData.telefone,
          tipo: rowData.tipo as TipoEducador,
          dataContratacao: rowData.data_contratacao || new Date().toISOString(),
        };

        await this.criar(criarDados, escolaId);
        sucesso++;
      } catch (err: any) {
        falhas++;
        erros.push(`Linha ${index + 2}: ${err.message || 'Erro desconhecido'}`);
      }
    }

    return { sucesso, falhas, erros };
  }

  atualizar(id: string, dados: AtualizarEducadorDados) {
    return this.educadorRepository.atualizar(id, dados);
  }

  desativar(id: string) {
    return this.educadorRepository.desativar(id);
  }

  reativar(id: string) {
    return this.educadorRepository.reativar(id);
  }
}
