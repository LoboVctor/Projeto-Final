import { Controller, Get, Post, Patch, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Query,
   UseInterceptors, UploadedFile, HttpCode, HttpStatus, Request, BadRequestException, ParseFilePipe, 
  MaxFileSizeValidator, FileValidator } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { EstudanteService } from './estudante.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { EspecificidadeDto } from './dtos/create.especifidades.dto.js';
import { VisaoGeralResponseDto } from './dtos/visao-geral-response.dto.js';
import { ObterAgendaSemanaDto } from './dtos/obter-agenda-semana.dto.js';
import { BuscarEstudantesQueryDto } from './dtos/buscar-estudantes-query.dto.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CreateRegistroAulaBatchDto } from './dtos/create-registro-aula.dto.js';
import { CreateAulaEstudanteDto } from './dtos/create-aula.dto.js';

/**
 * Validador customizado de tipo de arquivo baseado em mimetype.
 *
 * Substitui o FileTypeValidator nativo do Nest, que valida lendo o
 * "magic number" a partir de file.buffer — disponível apenas quando o
 * Multer usa memoryStorage. Como os endpoints de laudos usam diskStorage,
 * file.buffer não é populado, e o FileTypeValidator falhava sempre com:
 * "file buffer is not available; file type validation could not be performed".
 *
 * Este validador usa file.mimetype (preenchido pelo Multer a partir do
 * header Content-Type do arquivo enviado), funcionando com qualquer storage.
 */
class MimeTypeValidator extends FileValidator<{ allowedTypes: string[] }> {
  constructor(options: { allowedTypes: string[] }) {
    super(options);
  }

  isValid(file?: Express.Multer.File): boolean {
    if (!file) return false;
    return this.validationOptions.allowedTypes.includes(file.mimetype);
  }

  buildErrorMessage(): string {
    return `Formato de arquivo inválido. Permitidos: ${this.validationOptions.allowedTypes.join(', ')}`;
  }
}

const TIPOS_ARQUIVO_PERMITIDOS = ['image/png', 'image/jpeg', 'application/pdf'];

@ApiTags('Estudantes')
@ApiBearerAuth()
@Controller('estudantes')
@UseGuards(JwtAuthGuard)
export class EstudantesController {
  constructor(private readonly estudanteService: EstudanteService) {}

  /**
   * POST /estudantes/importar-csv
   * Importa estudantes em lote a partir de um arquivo CSV.
   */
  @Post('importar-csv')
  @ApiOperation({ summary: 'Importa estudantes via arquivo CSV' })
  @UseInterceptors(FileInterceptor('arquivo'))
  async importarCSV(@UploadedFile() arquivo: Express.Multer.File, @Request() req: any) {
    if (!arquivo) {
      throw new BadRequestException('Arquivo não enviado');
    }
    const logadoId = req.user.educadorId;
    return this.estudanteService.importarCSV(arquivo, logadoId);
  }

  /**
   * Lista todos os estudantes com filtros opcionais (nome, matrícula, diagnóstico) e paginação.
   * Utilizado pela Tela 4 — Gerenciamento Geral de Alunos.
   */
  @Get()
  @ApiOperation({
    summary: 'Lista estudantes com filtros dinâmicos e paginação (Tela 4)',
  })
  async listarTodos(@Query() query: BuscarEstudantesQueryDto) {
    return this.estudanteService.buscarTodos(query);
  }

  @Get(':id/visao-geral')
  @ApiOperation({
    summary:
      'Retorna a visão geral do estudante (dados pessoais, turma, responsável e especificidades)',
  })
  @ApiOkResponse({ type: VisaoGeralResponseDto })
  async buscarVisaoGeral(@Param('id') id: string) {
    return this.estudanteService.getVisaoGeral(id);
  }

  // ==========================================
  // DADOS GERAIS DE SAÚDE
  // ==========================================
  @Get(':id/saude')
  @ApiOperation({
    summary:
      'Retorna os dados de saúde do estudante (medicamentos, laudos e diagnósticos)',
  })
  async buscarDadosSaude(@Param('id') id: string) {
    return this.estudanteService.getSaude(id);
  }

  // ==========================================
  // DADOS PEDAGÓGICOS (Relatórios + Metas + PIBI)
  // ==========================================
  @Get(':id/pedagogico')
  @ApiOperation({
    summary:
      'Retorna os dados pedagógicos do estudante (relatórios, metas e PIBIs)',
  })
  async buscarDadosPedagogicos(@Param('id') id: string) {
    return this.estudanteService.getPedagogico(id);
  }

  @Get(':id/agenda/semana')
  @ApiOperation({
    summary:
      'Retorna a agenda da semana de um estudante a partir de uma data base',
  })
  async obterAgendaSemana(
    @Param('id') id: string,
    @Query() query: ObterAgendaSemanaDto,
  ) {
    return this.estudanteService.obterAgendaSemana(id, query);
  }

  // ==========================================
  // ESPECIFICIDADES / RESTRIÇÕES
  // ==========================================
  @Post(':estudanteId/especificidades')
  @ApiOperation({
    summary:
      'Adiciona uma nova especificidade (restrição, TEA, TDAH etc.) a um estudante',
  })
  async createEspecificidade(
    @Param('estudanteId') estudanteId: string,
    @Body() dto: EspecificidadeDto,
  ) {
    return this.estudanteService.createEspecificidade(estudanteId, dto);
  }

  @Patch(':estudanteId/especificidades/:especificidadeId')
  @ApiOperation({
    summary: 'Atualiza uma especificidade existente de um estudante',
  })
  async updateEspecificidade(
    @Param('estudanteId') estudanteId: string,
    @Param('especificidadeId', ParseIntPipe) especificidadeId: number,
    @Body() dto: EspecificidadeDto,
  ) {
    return this.estudanteService.updateEspecificidade(
      estudanteId,
      especificidadeId,
      dto,
    );
  }

  @Delete(':estudanteId/especificidades/:especificidadeId')
  @ApiOperation({ summary: 'Remove uma especificidade de um estudante' })
  async removeEspecificidade(
    @Param('estudanteId') estudanteId: string,
    @Param('especificidadeId', ParseIntPipe) especificidadeId: number,
  ) {
    return this.estudanteService.deleteEspecificidade(
      estudanteId,
      especificidadeId,
    );
  }

  // ==========================================
  // LAUDOS E DIAGNÓSTICOS
  // ==========================================
  @Post(':estudanteId/laudos')
  @ApiOperation({
    summary:
      'Adiciona um laudo/diagnóstico (com upload de arquivo PDF/imagem) a um estudante',
  })
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: diskStorage({
        destination: './uploads/laudos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extensao = extname(file.originalname);
          cb(null, `${uniqueSuffix}${extensao}`);
        },
      }),
    }),
  )
  async adicionarLaudo(
    @Param('estudanteId') estudanteId: string,
    @Body() body: { tipoDiagnostico: string; tipoDocumento: string; dataEmissao: string },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB em bytes
          new MimeTypeValidator({ allowedTypes: TIPOS_ARQUIVO_PERMITIDOS }),
        ],
      }),
    )
    arquivo: Express.Multer.File,
  ) {
    return this.estudanteService.adicionarLaudo(estudanteId, body, arquivo);
  }

  @Patch(':estudanteId/laudos/:documentoId')
  @ApiOperation({
    summary: 'Atualiza um laudo existente, permitindo substituir o arquivo',
  })
  @UseInterceptors(
    FileInterceptor('arquivo', {
      storage: diskStorage({
        destination: './uploads/laudos',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const extensao = extname(file.originalname);
          cb(null, `${uniqueSuffix}${extensao}`);
        },
      }),
    }),
  )
  async atualizarLaudo(
    @Param('documentoId') documentoId: string,
    @Body() body: { tipoDocumento: string; dataEmissao: string },
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false, 
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new MimeTypeValidator({ allowedTypes: TIPOS_ARQUIVO_PERMITIDOS }),
        ],
      }),
    )
    arquivo?: Express.Multer.File,
  ) {
    return this.estudanteService.atualizarLaudo(documentoId, body, arquivo);
  }

  @Delete(':estudanteId/laudos/:documentoId')
  @ApiOperation({
    summary: 'Remove um laudo/documento de um estudante pelo ID do documento',
  })
  async removerLaudo(@Param('documentoId') documentoId: string) {
    return this.estudanteService.removerLaudo(documentoId);
  }

  // ==========================================
  // MEDICAMENTOS
  // ==========================================

  @Post(':estudanteId/medicamentos')
  @ApiOperation({
    summary: 'Registra um novo medicamento em uso pelo estudante',
  })
  async addMedicamento(
    @Param('estudanteId') estudanteId: string,
    @Body() dados: any,
  ) {
    return this.estudanteService.addMedicamento(estudanteId, dados);
  }

  @Put(':estudanteId/medicamentos/:medicamentoId') 
  @ApiOperation({
    summary: 'Atualiza os dados de um medicamento registrado para o estudante',
  })
  async updateMedicamento(
    @Param('estudanteId') estudanteId: string,
    @Param('medicamentoId') medicamentoId: string,
    @Body() dados: any,
  ) {
    return this.estudanteService.updateMedicamento(
      estudanteId,
      Number(medicamentoId),
      dados,
    );
  }

  @Delete(':estudanteId/medicamentos/:medicamentoId')
  @ApiOperation({
    summary: 'Remove um medicamento registrado para o estudante',
  })
  async removeMedicamento(
    @Param('estudanteId') estudanteId: string,
    @Param('medicamentoId') medicamentoId: string,
  ) {
    return this.estudanteService.removeMedicamento(
      estudanteId,
      Number(medicamentoId),
    );
  }

  @Post(':estudanteId/aulas')
  @ApiOperation({
    summary: 'Registra uma nova aula para o estudante na agenda semanal',
  })
  async adicionarAula(
    @Param('estudanteId') estudanteId: string,
    @Body() dto: CreateAulaEstudanteDto,
  ) {
    return this.estudanteService.adicionarAula(estudanteId, dto);
  }

  @Post('registros-aula/batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar chamada e desempenho da turma em lote' })
  @ApiResponse({ status: 201, description: 'Chamada registrada em lote com sucesso.' })
  @ApiResponse({ status: 400, description: 'Requisição inválida ou DTO malformado.' })
  async registrarChamadaLote(@Body() createBatchDto: CreateRegistroAulaBatchDto) {
    return this.estudanteService.registrarChamadaLote(createBatchDto);
  }

}