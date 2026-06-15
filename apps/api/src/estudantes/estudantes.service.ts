import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EspecificidadeDto } from './dto/create.especifidades.dto'; 

@Injectable()
export class EstudantesService {
  constructor(private prisma: PrismaService) {}

  async getSaude(estudanteId: string) {
    const dadosSaude = await this.prisma.client.estudante.findUnique({
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
            diagnostico: {
              select: {
                nome: true,
              },
            },
            documentos: {
              select: {
                id: true,
                tipo: true,
                arquivo: true,
                dataEmissao: true,
              },
            },
          },
        },
        medicamentos: {
          select: {
            dosagem: true,
            unidadeMedida: true,
            horarioAdministrado: true,
            administradoEscola: true,
            medicamento: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

    if (!dadosSaude) {
      throw new NotFoundException('Estudante não encontrado.');
    }

    return this.mapearRetornoSaude(dadosSaude);
  }

  private mapearRetornoSaude(dados: any) {
    return {
      estudanteId: dados.id,
      nomeCompleto: dados.nomeCompleto,
      
      especificidades: dados.especificidades.map((e: any) => ({
        especificidadeId: e.especificidadeId, // <-- Adicionado
        descricao: e.especificidade.descricao,
        categoria: e.especificidade.categoria,
        tipo: e.especificidade.tipo,
        observacao: e.obsReacao,
      })),

      laudos: dados.diagnosticos.flatMap((d: any) => 
        d.documentos.map((doc: any) => ({
          id: doc.id,
          diagnostico: d.diagnostico.nome,
          tipo: doc.tipo,
          urlArquivo: doc.arquivo,
          dataEmissao: doc.dataEmissao,
        }))
      ),

      medicamentos: dados.medicamentos.map((m: any) => ({
        nome: m.medicamento.nome,
        dosagem: `${m.dosagem} ${m.unidadeMedida}`,
        horarioAdministrado: m.horarioAdministrado,
        administradoEscola: m.administradoEscola,
      })),
    };
  }

  // ==========================================
  // CRUD DE ESPECIFICIDADES
  // ==========================================

  async createEspecificidade(estudanteId: string, dto: EspecificidadeDto) {
    let especificidade = await this.prisma.client.especificidade.findFirst({
      where: { 
        tipo: dto.tipo, 
        categoria: dto.categoria,
        descricao: { equals: dto.descricao, mode: 'insensitive' } 
      }
    });

    if (!especificidade) {
      especificidade = await this.prisma.client.especificidade.create({
        data: { tipo: dto.tipo, categoria: dto.categoria, descricao: dto.descricao }
      });
    }

    const vinculoExistente = await this.prisma.client.estudanteEspecificidade.findUnique({
      where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: especificidade.id } }
    });

    if (vinculoExistente) {
       return this.prisma.client.estudanteEspecificidade.update({
         where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: especificidade.id } },
         data: { obsReacao: dto.observacao }
       });
    }

    return this.prisma.client.estudanteEspecificidade.create({
      data: {
        estudanteId,
        especificidadeId: especificidade.id,
        obsReacao: dto.observacao,
      }
    });
  }

  async updateEspecificidade(estudanteId: string, especificidadeIdAntiga: number, dto: EspecificidadeDto) {
    let novaEspecificidade = await this.prisma.client.especificidade.findFirst({
      where: { 
        tipo: dto.tipo, 
        categoria: dto.categoria,
        descricao: { equals: dto.descricao, mode: 'insensitive' } 
      }
    });

    if (!novaEspecificidade) {
      novaEspecificidade = await this.prisma.client.especificidade.create({
        data: { tipo: dto.tipo, categoria: dto.categoria, descricao: dto.descricao }
      });
    }

    if (novaEspecificidade.id !== especificidadeIdAntiga) {
       const jaTemNova = await this.prisma.client.estudanteEspecificidade.findUnique({
          where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: novaEspecificidade.id } }
       });

       if (jaTemNova) {
          await this.prisma.client.estudanteEspecificidade.delete({
             where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: especificidadeIdAntiga } }
          });
          return this.prisma.client.estudanteEspecificidade.update({
             where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: novaEspecificidade.id } },
             data: { obsReacao: dto.observacao }
          });
       } else {
          return this.prisma.client.estudanteEspecificidade.update({
            where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: especificidadeIdAntiga } },
            data: {
              especificidadeId: novaEspecificidade.id,
              obsReacao: dto.observacao,
            }
          });
       }
    } else {
       return this.prisma.client.estudanteEspecificidade.update({
          where: { estudanteId_especificidadeId: { estudanteId, especificidadeId: especificidadeIdAntiga } },
          data: { obsReacao: dto.observacao }
       });
    }
  }

  async deleteEspecificidade(estudanteId: string, especificidadeId: number) {
    return this.prisma.client.estudanteEspecificidade.delete({
      where: {
        estudanteId_especificidadeId: { estudanteId, especificidadeId }
      }
    });
  }
}