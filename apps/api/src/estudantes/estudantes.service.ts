import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 

@Injectable()
export class EstudantesService {
  constructor(private prisma: PrismaService) {}

  async getSaude(estudanteId: string) {
    const dadosSaude = await this.prisma.client.estudante.findUnique({
      where: { id: estudanteId },
      select: {
        id: true,
        nomeCompleto: true,
        // 1. Coletando Restrições (Especificidades)
        especificidades: {
          select: {
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
        // 2. Coletando Laudos/Documentos via Diagnósticos
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
                arquivo: true, // Aqui presumimos que guarda a URL ou caminho do S3/Storage
                dataEmissao: true,
              },
            },
          },
        },
        // 3. Coletando Receitas e Medicamentos
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

    // Opcional: Mapear o retorno para facilitar a vida do Frontend (DTO de saída)
    return this.mapearRetornoSaude(dadosSaude);
  }

  // Função auxiliar para deixar o JSON de resposta mais limpo para o Angular
  private mapearRetornoSaude(dados: any) {
    return {
      estudanteId: dados.id,
      nomeCompleto: dados.nomeCompleto,
      
      restricoes: dados.especificidades.map((e: any) => ({
        descricao: e.especificidade.descricao,
        categoria: e.especificidade.categoria,
        tipo: e.especificidade.tipo,
        observacao: e.obsReacao,
      })),

      // Achata os documentos de todos os diagnósticos num único array
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
}