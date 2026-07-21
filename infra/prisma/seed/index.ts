import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../../../apps/api/.env') });

import {
  PrismaClient,
  Role,
  TipoEducador,
  Sexo,
  Fcom,
  Turno,
  Etapa,
  TipoTurma,
  TipoEspecificidade,
  CategoriaEspecificidade,
  UnidadeM,
  TipoDocumento,
  DiaSemana,
  StatusAula,
  TipoDiagnostico,
  GrauParentesco,
  Semestre,
  StatusRelatorio,
  Eixos,
  Bimestre,
} from '../../generated/prisma/index.js';
import * as bcrypt from 'bcrypt';
import { fakerPT_BR as faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 12;
const NUM_PROFESSORES = 12;
const ALUNOS_POR_TURMA = 7;
const DIAS_DE_HISTORICO = 90;
const URL_LAUDO_PADRAO = 'http://localhost:3000/api/v1/uploads/laudos/1781883929415-924710107.pdf';

faker.seed(20260716);

const diagnosticosBase: { tipo: TipoDiagnostico; nome: string; descricao: string }[] = [
  { tipo: TipoDiagnostico.TEA, nome: 'Transtorno do Espectro Autista', descricao: 'Dificuldades na comunicação e interação social, comportamentos repetitivos.' },
  { tipo: TipoDiagnostico.TDAH, nome: 'Transtorno do Déficit de Atenção com Hiperatividade', descricao: 'Desatenção, hiperatividade e impulsividade.' },
  { tipo: TipoDiagnostico.SINDROME_DOWN, nome: 'Síndrome de Down', descricao: 'Alteração genética provocada pela presença de um cromossomo 21 extra.' },
  { tipo: TipoDiagnostico.PARALISIA_CEREBRAL, nome: 'Paralisia Cerebral', descricao: 'Distúrbio motor causado por lesão no cérebro em desenvolvimento.' },
  { tipo: TipoDiagnostico.DEFICIENCIA_INTELECTUAL, nome: 'Deficiência Intelectual', descricao: 'Limitações significativas no funcionamento intelectual e no comportamento adaptativo.' },
  { tipo: TipoDiagnostico.DEFICIENCIA_MULTIPLA, nome: 'Deficiência Múltipla', descricao: 'Associação de duas ou mais deficiências primárias.' },
];

const especificidadesBase: { tipo: TipoEspecificidade; categoria: CategoriaEspecificidade; descricao: string }[] = [
  { tipo: TipoEspecificidade.RESTRICAO, categoria: CategoriaEspecificidade.ALIMENTAR, descricao: 'Restrição a glúten e derivados de leite.' },
  { tipo: TipoEspecificidade.RESTRICAO, categoria: CategoriaEspecificidade.SENSORIAL, descricao: 'Alergia severa a látex.' },
  { tipo: TipoEspecificidade.COMPORTAMENTO_ATIPICO, categoria: CategoriaEspecificidade.COMPORTAMENTAL, descricao: 'Apresenta ecolalia em momentos de ansiedade.' },
  { tipo: TipoEspecificidade.GATILHO_CRISE, categoria: CategoriaEspecificidade.SENSORIAL, descricao: 'Sons altos e repentinos desencadeiam crises de ansiedade.' },
  { tipo: TipoEspecificidade.GATILHO_CRISE, categoria: CategoriaEspecificidade.COMPORTAMENTAL, descricao: 'Mudanças abruptas de rotina desencadeiam crises.' },
  { tipo: TipoEspecificidade.CONTENCAO, categoria: CategoriaEspecificidade.MOTORA, descricao: 'Protocolo de contenção física suave em episódios de agitação.' },
  { tipo: TipoEspecificidade.CONTENCAO, categoria: CategoriaEspecificidade.COMPORTAMENTAL, descricao: 'Protocolo de redirecionamento verbal em episódios de crise.' },
];

const medicamentosBase = ['Risperidona', 'Metilfenidato', 'Sertralina', 'Ácido Valproico', 'Melatonina'];

const bairrosBase = ['Centro', 'Tijuca', 'Copacabana', 'Botafogo', 'Méier', 'Madureira', 'Penha', 'Bangu', 'Campo Grande', 'Ipanema'];

const eixos = Object.values(Eixos);
const grausParentesco = Object.values(GrauParentesco);

function criarDataComHorario(horaStr: string): Date {
  return new Date(`1970-01-01T${horaStr}:00.000Z`);
}

function gerarNotaAleatoria(min: number, max: number): number {
  return faker.number.int({ min, max });
}

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}

async function main() {
  console.log('Iniciando seed...\n');

  console.log('Limpando dados anteriores...');
  await prisma.auditoriaExportacao.deleteMany();
  await prisma.pibi.deleteMany();
  await prisma.metaDesenvolvimento.deleteMany();
  await prisma.relatorioSemestral.deleteMany();
  await prisma.estudoCaso.deleteMany();
  await prisma.documentoDiagnostico.deleteMany();
  await prisma.estudanteDiagnostico.deleteMany();
  await prisma.estudanteResponsavel.deleteMany();
  await prisma.responsavel.deleteMany();
  await prisma.estudanteEspecificidade.deleteMany();
  await prisma.estudanteMedicamento.deleteMany();
  await prisma.registroDiario.deleteMany();
  await prisma.registroAula.deleteMany();
  await prisma.aula.deleteMany();
  await prisma.estudante.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.usuario.deleteMany({ where: { role: { not: Role.COORDENADOR } } });
  await prisma.educador.deleteMany();
  await prisma.especificidade.deleteMany();
  await prisma.medicamento.deleteMany();
  await prisma.diagnostico.deleteMany();
  console.log('Limpeza concluída.');

  // ==========================================
  // ESCOLA E COORDENADOR ADMIN
  // ==========================================
  const escola = await prisma.escola.upsert({
    where: { id: '11111111-1111-1111-1111-111111111111' },
    update: {},
    create: {
      id: '11111111-1111-1111-1111-111111111111',
      nome: 'Escola Municipal ELO',
      bairro: 'Centro',
      endereco: 'Rua das Aces, 100',
      telefone: '(21) 99999-0000',
      email: 'contato@escola.elo',
      codInep: '33000000',
    },
  });
  console.log(` Escola criada: "${escola.nome}" (id: ${escola.id})`);

  const educadorAdmin = await prisma.educador.upsert({
    where: { id: '123e4567-e89b-42d3-8456-426614174999' },
    update: {},
    create: {
      id: '123e4567-e89b-42d3-8456-426614174999',
      matricula: 'COORD-2026',
      nome: 'Niéliton Gomes',
      cpf: '000.000.000-00',
      dataContratacao: new Date('2024-01-01'),
      tipo: TipoEducador.COORDENADOR,
      telefone: '(21) 90000-0000',
      escolaId: escola.id,
    },
  });

  const senhaAdminHash = await bcrypt.hash('Admin@1234', SALT_ROUNDS);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@escola.elo' },
    update: { senha: senhaAdminHash, deveMudarSenha: false, educadorId: educadorAdmin.id },
    create: {
      email: 'admin@escola.elo',
      senha: senhaAdminHash,
      role: Role.COORDENADOR,
      educadorId: educadorAdmin.id,
      deveMudarSenha: false,
    },
  });
  console.log(` Admin criado: "${admin.email}" (role: ${admin.role})`);

  // ==========================================
  // ENTIDADES AUXILIARES ESTÁTICAS
  // ==========================================
  console.log('\nCriando diagnósticos, especificidades e medicamentos...');

  const diagnosticos = [];
  for (const d of diagnosticosBase) {
    diagnosticos.push(
      await prisma.diagnostico.create({
        data: { nome: d.nome, tipo: d.tipo, descricao: d.descricao },
      }),
    );
  }

  const especificidades = [];
  for (const e of especificidadesBase) {
    especificidades.push(
      await prisma.especificidade.create({
        data: { tipo: e.tipo, categoria: e.categoria, descricao: e.descricao },
      }),
    );
  }

  const medicamentos = [];
  for (const nome of medicamentosBase) {
    medicamentos.push(await prisma.medicamento.create({ data: { nome } }));
  }
  console.log(` ${diagnosticos.length} diagnósticos, ${especificidades.length} especificidades e ${medicamentos.length} medicamentos criados.`);

  // ==========================================
  // LOOP DE PROFESSORES, TURMAS E ALUNOS
  // ==========================================
  console.log(`\nCriando ${NUM_PROFESSORES} professores, cada um com 1 turma e ${ALUNOS_POR_TURMA} alunos...`);

  const senhaProfHash = await bcrypt.hash('Prof@1234', SALT_ROUNDS);
  const senhaResponsavelHash = await bcrypt.hash('Elo@1234', SALT_ROUNDS);

  const todosEstudantesIds: string[] = [];
  const todosEducadores: { id: string; escolaId: string }[] = [educadorAdmin];
  const aulasRecorrentesPorTurma: { turmaId: string; educadorId: string; aulas: { id: string; diaSemana: DiaSemana }[] }[] = [];
  const registrosDiariosMock: any[] = [];
  const registrosAulasMock: any[] = [];
  const eventosMock: any[] = [];

  const dataReferencia = new Date();
  const hoje = new Date(Date.UTC(dataReferencia.getFullYear(), dataReferencia.getMonth(), dataReferencia.getDate(), 12, 0, 0));

  const diasSemanaDisponiveis = [DiaSemana.SEGUNDA, DiaSemana.TERCA, DiaSemana.QUARTA, DiaSemana.QUINTA, DiaSemana.SEXTA];
  const jsDayToDiaSemana: Record<number, DiaSemana | null> = {
    0: null,
    1: DiaSemana.SEGUNDA,
    2: DiaSemana.TERCA,
    3: DiaSemana.QUARTA,
    4: DiaSemana.QUINTA,
    5: DiaSemana.SEXTA,
    6: null,
  };

  for (let p = 1; p <= NUM_PROFESSORES; p++) {
    const nomeProfessor = faker.person.fullName();
    const cpfProfessor = faker.helpers.replaceSymbols('###.###.###-##');

    const educador = await prisma.educador.create({
      data: {
        matricula: `REG-2026-${String(p).padStart(3, '0')}`,
        nome: nomeProfessor,
        cpf: cpfProfessor,
        dataContratacao: faker.date.past({ years: 5 }),
        tipo: TipoEducador.REGENTE,
        telefone: faker.helpers.replaceSymbols('(21) 9####-####'),
        escolaId: escola.id,
      },
    });
    todosEducadores.push(educador);

    await prisma.usuario.create({
      data: {
        email: `professor${p}@escola.elo`,
        senha: senhaProfHash,
        role: Role.PROFESSOR_REGENTE,
        educadorId: educador.id,
        deveMudarSenha: false,
      },
    });

    const diagnosticoDaTurma = faker.helpers.arrayElement(diagnosticos);
    const numeroEtapa = faker.number.int({ min: 1, max: 3 });
    const etapaDaTurma = ([Etapa.ETAPA_1, Etapa.ETAPA_2, Etapa.ETAPA_3])[numeroEtapa - 1];
    const nomeDiagnosticoTitulo = diagnosticoDaTurma.nome
      .split(' ')
      .map((palavra) => (palavra.length > 2 ? palavra[0].toUpperCase() + palavra.slice(1).toLowerCase() : palavra.toLowerCase()))
      .join(' ');

    const turma = await prisma.turma.create({
      data: {
        escolaId: escola.id,
        educadorId: educador.id,
        nome: nomeDiagnosticoTitulo,
        turno: faker.helpers.arrayElement([Turno.MATUTINO, Turno.VESPERTINO, Turno.INTEGRAL]),
        anoLetivo: 2026,
        etapa: etapaDaTurma,
        tipo: TipoTurma.REGENCIA,
      },
    });

    // Cronograma semanal (3 dias aleatórios da turma)
    const diasDaTurma = faker.helpers.arrayElements(diasSemanaDisponiveis, 3);
    const aulasDaTurma: { id: string; diaSemana: DiaSemana }[] = [];
    for (const dia of diasDaTurma) {
      const aula = await prisma.aula.create({
        data: {
          turmaId: turma.id,
          educadorId: educador.id,
          diaSemana: dia,
          horarioInicio: criarDataComHorario('08:00'),
          horarioFim: criarDataComHorario('12:00'),
        },
      });
      aulasDaTurma.push({ id: aula.id, diaSemana: dia });
    }
    aulasRecorrentesPorTurma.push({ turmaId: turma.id, educadorId: educador.id, aulas: aulasDaTurma });

    console.log(` [${p}/${NUM_PROFESSORES}] Professor "${nomeProfessor}" e turma "${turma.nome}" criados.`);

    // Loop de alunos
    for (let a = 1; a <= ALUNOS_POR_TURMA; a++) {
      const sexo = faker.helpers.arrayElement([Sexo.MASCULINO, Sexo.FEMININO]);
      const nomeCompleto = faker.person.fullName({ sex: sexo === Sexo.MASCULINO ? 'male' : 'female' });
      const dataNascimento = faker.date.birthdate({ min: 4, max: 10, mode: 'age' });
      const cpfEstudante = faker.helpers.replaceSymbols('###.###.###-##');
      const matricula = `2026${String(p).padStart(2, '0')}${String(a).padStart(2, '0')}`;
      const seedAvatar = `${faker.string.alphanumeric(8)}`;

      const estudante = await prisma.estudante.create({
        data: {
          matricula,
          nomeCompleto,
          dataNascimento,
          cpf: cpfEstudante,
          sexo,
          foto: `https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=${seedAvatar}`,
          formaComunicacao: faker.helpers.arrayElement([Fcom.VERBAL, Fcom.NAO_VERBAL]),
          statusMatricula: true,
          escolaId: escola.id,
          turmas: { connect: [{ id: turma.id }] },
          diagnosticos: {
            create: [{ diagnostico: { connect: { id: diagnosticoDaTurma.id } } }],
          },
        },
      });
      todosEstudantesIds.push(estudante.id);

      // Documento de laudo médico (URL padrão, conforme decisão do plano)
      await prisma.documentoDiagnostico.create({
        data: {
          tipo: TipoDocumento.LAUDO_MEDICO,
          arquivo: URL_LAUDO_PADRAO,
          dataEmissao: faker.date.past({ years: 2 }),
          estudanteId: estudante.id,
          diagnosticoId: diagnosticoDaTurma.id,
        },
      });

      // Especificidades sorteadas (0 a 2)
      const especificidadesSorteadas = faker.helpers.arrayElements(especificidades, faker.number.int({ min: 0, max: 2 }));
      for (const esp of especificidadesSorteadas) {
        await prisma.estudanteEspecificidade.create({
          data: {
            estudanteId: estudante.id,
            especificidadeId: esp.id,
            obsReacao: faker.lorem.sentence({ min: 8, max: 16 }),
          },
        });
      }

      // Medicamento sorteado (50% de chance)
      if (faker.datatype.boolean()) {
        const medicamento = faker.helpers.arrayElement(medicamentos);
        await prisma.estudanteMedicamento.create({
          data: {
            estudanteId: estudante.id,
            medicamentoId: medicamento.id,
            dosagem: faker.number.float({ min: 0.5, max: 5, fractionDigits: 1 }),
            unidadeMedida: faker.helpers.arrayElement([UnidadeM.MG, UnidadeM.ML, UnidadeM.COMPRIMIDO, UnidadeM.GOTAS]),
            intervaloAdministracao: faker.helpers.arrayElement([8, 12, 24]),
            horarioAdministrado: new Date('2026-01-01T13:00:00.000Z'),
            administradoEscola: true,
          },
        });
      }

      // Responsável (apenas o registro + vínculo com o estudante, sem Usuario)
      const nomeResponsavel = faker.person.fullName();
      const responsavel = await prisma.responsavel.create({
        data: {
          cpf: somenteDigitos(faker.helpers.replaceSymbols('###########')),
          nomeCompleto: nomeResponsavel,
          sexo: faker.helpers.arrayElement([Sexo.MASCULINO, Sexo.FEMININO]),
          email: faker.internet.email({ firstName: nomeResponsavel.split(' ')[0] }).toLowerCase(),
          telefone: somenteDigitos(faker.helpers.replaceSymbols('21#########')),
          bairro: faker.helpers.arrayElement(bairrosBase),
          endereco: `${faker.location.streetAddress()}, Rio de Janeiro - RJ`,
        },
      });

      await prisma.estudanteResponsavel.create({
        data: {
          estudanteId: estudante.id,
          responsavelId: responsavel.id,
          grauParentesco: faker.helpers.arrayElement(grausParentesco),
          responsavelPrincipal: true,
        },
      });

      // Estudo de Caso (1 registro, com o educador da turma como participante)
      await prisma.estudoCaso.create({
        data: {
          estudanteId: estudante.id,
          dataReuniao: faker.date.past({ years: 1 }),
          parecerDecisao: faker.lorem.sentence({ min: 12, max: 25 }),
          educadores: { connect: [{ id: educador.id }] },
        },
      });

      // Relatório Semestral (1º semestre de 2026) + Metas de Desenvolvimento + Pibis
      const relatorio = await prisma.relatorioSemestral.create({
        data: {
          estudanteId: estudante.id,
          semestre: Semestre.PRIMEIRO,
          ano: 2026,
          parecerGlobalDesenvolvimento: faker.lorem.paragraph(),
          status: faker.helpers.arrayElement([StatusRelatorio.EM_REVISAO, StatusRelatorio.CONCLUIDO]),
          dataFechamento: faker.date.recent({ days: 30 }),
        },
      });

      for (const eixo of eixos) {
        const scoreFinal = gerarNotaAleatoria(0, 5);
        const meta = await prisma.metaDesenvolvimento.create({
          data: {
            relatorioSemestralId: relatorio.id,
            descricao: faker.lorem.sentence({ min: 6, max: 12 }),
            eixoDesenvolvimento: eixo,
            scoreFinal,
            parecer: faker.lorem.sentence({ min: 8, max: 14 }),
          },
        });

        for (const bimestre of [Bimestre.PRIMEIRO, Bimestre.SEGUNDO]) {
          await prisma.pibi.create({
            data: {
              metaId: meta.id,
              bimestre,
              status: faker.helpers.arrayElement([StatusRelatorio.EM_REVISAO, StatusRelatorio.CONCLUIDO]),
              scoreAtingibilidade: gerarNotaAleatoria(0, 5),
              parecerEvolutivo: faker.lorem.sentence({ min: 8, max: 14 }),
            },
          });
        }
      }

      // Histórico de registros diários (dias úteis retroativos)
      for (let i = 1; i <= DIAS_DE_HISTORICO; i++) {
        const dataRegistro = new Date(hoje);
        dataRegistro.setUTCDate(hoje.getUTCDate() - i);
        const diaDaSemana = dataRegistro.getUTCDay();
        if (diaDaSemana === 0 || diaDaSemana === 6) continue;

        registrosDiariosMock.push({
          estudanteId: estudante.id,
          educadorId: educador.id,
          data: dataRegistro,
          scoreComportamento: gerarNotaAleatoria(3, 5),
          scoreInteracao: gerarNotaAleatoria(2, 5),
          scoreFoco: gerarNotaAleatoria(3, 5),
          scoreAutonomia: gerarNotaAleatoria(2, 5),
          statusAlimentacao: gerarNotaAleatoria(4, 5),
          usoBanheiro: gerarNotaAleatoria(3, 5),
          preenchido: true,
          anotacoes: 'Registro diário gerado automaticamente via seed script.',
        });

        const diaSemanaEnum = jsDayToDiaSemana[diaDaSemana];
        const aulaDoDia = diaSemanaEnum ? aulasDaTurma.find((au) => au.diaSemana === diaSemanaEnum) : undefined;

        if (aulaDoDia) {
          let status: StatusAula = StatusAula.REALIZADA;
          let estevePresente = faker.number.float({ min: 0, max: 1 }) > 0.12;

          if (i % 25 === 0) {
            status = StatusAula.FERIADO;
            estevePresente = false;
          } else if (i % 40 === 0) {
            status = StatusAula.FALTA_EDUCADOR;
            estevePresente = false;
          }

          registrosAulasMock.push({
            estudanteId: estudante.id,
            aulaId: aulaDoDia.id,
            data: dataRegistro,
            status_aula: status,
            presenca: estevePresente,
            scoreParticipacao: status === StatusAula.REALIZADA && estevePresente ? gerarNotaAleatoria(3, 5) : null,
            scoreSuporte: status === StatusAula.REALIZADA && estevePresente ? gerarNotaAleatoria(1, 3) : null,
          });
        }
      }

      // Registros pendentes (hoje e ontem, ainda não preenchidos)
      const dataOntem = new Date(hoje);
      dataOntem.setUTCDate(hoje.getUTCDate() - 1);
      for (const dataPendente of [dataOntem, hoje]) {
        const diaDaSemana = dataPendente.getUTCDay();
        if (diaDaSemana === 0 || diaDaSemana === 6) continue;

        registrosDiariosMock.push({
          estudanteId: estudante.id,
          educadorId: educador.id,
          data: dataPendente,
          scoreComportamento: 0,
          scoreInteracao: 0,
          scoreFoco: 0,
          scoreAutonomia: 0,
          statusAlimentacao: 0,
          usoBanheiro: 0,
          preenchido: false,
        });
      }
    }
  }

  console.log('\nInserindo registros diários e de aula em lote...');
  await prisma.registroDiario.createMany({ data: registrosDiariosMock });
  console.log(` ${registrosDiariosMock.length} registros diários criados para ${todosEstudantesIds.length} estudantes.`);

  await prisma.registroAula.createMany({ data: registrosAulasMock });
  console.log(` ${registrosAulasMock.length} registros de aula criados.`);

  // ==========================================
  // EVENTOS DE CALENDÁRIO (Aulas com isEvento = true)
  // ==========================================
  console.log('\nCriando eventos de calendário...');

  const tiposEvento = [
    { titulo: 'Reunião de Pais e Mestres', descricao: 'Encontro geral para alinhamento pedagógico do bimestre.' },
    { titulo: 'Passeio ao Museu de Ciências', descricao: 'Atividade extracurricular com foco em estímulo sensorial.' },
    { titulo: 'Semana da Inclusão', descricao: 'Conjunto de atividades voltadas à conscientização sobre inclusão escolar.' },
    { titulo: 'Avaliação Pedagógica Semestral', descricao: 'Reunião de fechamento dos relatórios semestrais.' },
    { titulo: 'Festa Junina da Escola', descricao: 'Evento comemorativo aberto à comunidade escolar.' },
  ];

  for (let i = 0; i < 8; i++) {
    const educadorDoEvento = faker.helpers.arrayElement(todosEducadores);
    const tipoEvento = faker.helpers.arrayElement(tiposEvento);
    const dataEvento = faker.date.soon({ days: 60, refDate: hoje });
    dataEvento.setUTCHours(faker.number.int({ min: 8, max: 16 }), 0, 0, 0);

    eventosMock.push({
      educadorId: educadorDoEvento.id,
      isEvento: true,
      titulo: tipoEvento.titulo,
      descricao: tipoEvento.descricao,
      dataEvento,
      horarioInicio: dataEvento,
      horarioFim: dataEvento,
    });
  }

  await prisma.aula.createMany({ data: eventosMock });
  console.log(` ${eventosMock.length} eventos de calendário criados.`);

  console.log('\n Seed concluído com sucesso!');
  console.log('─────────────────────────────────────────');
  console.log(' COORDENAÇÃO:');
  console.log('  Email : admin@escola.elo');
  console.log('  Senha : Admin@1234');
  console.log(' ───────────────────────────────────────');
  console.log(` PROFESSORES REGENTES (${NUM_PROFESSORES}):`);
  console.log('  Email : professor1@escola.elo ... até professor12@escola.elo');
  console.log('  Senha : Prof@1234 (para todos)');
  console.log('─────────────────────────────────────────');
  console.log(` Total de alunos gerados: ${todosEstudantesIds.length}`);
  console.log('─────────────────────────────────────────\n');
}

main()
  .catch((error) => {
    console.error('Erro no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
