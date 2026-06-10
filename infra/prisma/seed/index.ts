import 'dotenv/config';
import {
  PrismaClient,
  Role,
  TipoEducador,
  Sexo,
  Fcom,
  Turno,
  Etapa,
  TipoTurma
} from '../../generated/prisma/index.js';
import * as bcrypt from 'bcrypt';
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

async function main() {
  console.log('Iniciando seed...\n');

  // Limpeza de tabelas dependentes
  console.log('Limpando dados anteriores...');
  await prisma.estudanteDiagnostico.deleteMany();
  await prisma.documentoDiagnostico.deleteMany();
  await prisma.estudanteResponsavel.deleteMany();
  await prisma.estudanteEspecificidade.deleteMany();
  await prisma.estudanteMedicamento.deleteMany();
  await prisma.registroDiario.deleteMany();
  await prisma.registroAula.deleteMany();
  await prisma.aula.deleteMany();
  await prisma.estudoCaso.deleteMany();
  await prisma.relatorioSemestral.deleteMany();
  await prisma.estudante.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.diagnostico.deleteMany();
  console.log('Limpeza concluída.');

  // Escola padrão
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
  console.log(` Escolaridade criada: "${escola.nome}" (id: ${escola.id})`);

  // 2. Usuário Admin (COORDENADOR)
  const senhaAdminHash = await bcrypt.hash('Admin@1234', SALT_ROUNDS);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@escola.elo' },
    update: { senha: senhaAdminHash },
    create: {
      email: 'admin@escola.elo',
      senha: senhaAdminHash,
      role: Role.COORDENADOR,
    },
  });
  console.log(` Admin criado: "${admin.email}" (role: ${admin.role})`);

  // 3. Criar Educador (Professor Regente)
  const educador = await prisma.educador.upsert({
    where: { id: '22222222-2222-2222-2222-222222222222' },
    update: {},
    create: {
      id: '22222222-2222-2222-2222-222222222222',
      matricula: 'REG-2026',
      nome: 'Professor Cláudio Xavier',
      cpf: '111.111.111-11',
      dataContratacao: new Date('2024-02-10'),
      tipo: TipoEducador.REGENTE,
      telefone: '(21) 98888-5555',
      escolaId: escola.id,
    },
  });
  console.log(` Educador criado: "${educador.nome}" (id: ${educador.id})`);

  // 4. Criar Usuário do tipo PROFESSOR vinculado ao Educador
  const senhaProfHash = await bcrypt.hash('Prof@1234', SALT_ROUNDS);
  const usuarioProfessor = await prisma.usuario.upsert({
    where: { email: 'professor@escola.elo' },
    update: {
      senha: senhaProfHash,
      educadorId: educador.id
    },
    create: {
      email: 'professor@escola.elo',
      senha: senhaProfHash,
      role: Role.PROFESSOR,
      educadorId: educador.id,
    },
  });
  console.log(` Usuário do Educador criado: "${usuarioProfessor.email}"`);

  // 5. Criar Turma (tipo REGENCIA) ligando Escola, Educador
  const turmaAlpha = await prisma.turma.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: { educadorId: educador.id },
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      escolaId: escola.id,
      educadorId: educador.id,
      nome: '1º Ano - Turma Alpha',
      turno: Turno.MATUTINO,
      anoLetivo: 2026,
      etapa: Etapa.ENSINO_FUNDAMENTAL_1,
      tipo: TipoTurma.REGENCIA,
    },
  });
  console.log(` Turma criada: "${turmaAlpha.nome}" (Tipo: ${turmaAlpha.tipo})`);

  console.log(`Admin criado: "${admin.email}" (role: ${admin.role})`);

  // Diagnósticos
  const tea = await prisma.diagnostico.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'a0000000-0000-0000-0000-000000000001',
      nome: 'Transtorno do Espectro Autista',
      tipo: 'TEA',
      descricao: 'Dificuldades na comunicação e interação social, comportamentos repetitivos.',
    },
  });

  const tdah = await prisma.diagnostico.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'a0000000-0000-0000-0000-000000000002',
      nome: 'Transtorno do Déficit de Atenção com Hiperatividade',
      tipo: 'TDAH',
      descricao: 'Desatenção, hiperatividade e impulsividade.',
    },
  });

  const down = await prisma.diagnostico.upsert({
    where: { id: 'a0000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: 'a0000000-0000-0000-0000-000000000003',
      nome: 'Síndrome de Down',
      tipo: 'SINDROME_DOWN',
      descricao: 'Alteração genética provocada pela presença de um cromossomo 21 extra.',
    },
  });

  // Turmas
  const turma1 = await prisma.turma.upsert({
    where: { id: 'b0000000-0000-0000-0000-000000000001' },
    update: { educadorId: educador.id },
    create: {
      id: 'b0000000-0000-0000-0000-000000000001',
      escolaId: escola.id,
      educadorId: educador.id,
      nome: '1º Ano A',
      turno: Turno.VESPERTINO,
      anoLetivo: 2026,
      etapa: Etapa.ENSINO_FUNDAMENTAL_1,
      tipo: TipoTurma.REGENCIA,
    },
  });

  const turma2 = await prisma.turma.upsert({
    where: { id: 'b0000000-0000-0000-0000-000000000002' },
    update: { educadorId: educador.id },
    create: {
      id: 'b0000000-0000-0000-0000-000000000002',
      escolaId: escola.id,
      educadorId: educador.id,
      nome: '2º Ano B',
      turno: Turno.MATUTINO,
      anoLetivo: 2026,
      etapa: Etapa.ENSINO_FUNDAMENTAL_1,
      tipo: TipoTurma.REGENCIA,
    },
  });

  const turma3 = await prisma.turma.upsert({
    where: { id: 'b0000000-0000-0000-0000-000000000003' },
    update: { educadorId: educador.id },
    create: {
      id: 'b0000000-0000-0000-0000-000000000003',
      escolaId: escola.id,
      educadorId: educador.id,
      nome: 'Infantil IV',
      turno: Turno.MATUTINO,
      anoLetivo: 2026,
      etapa: Etapa.EDUCACAO_INFANTIL,
      tipo: TipoTurma.REGENCIA,
    },
  });

  console.log('Turmas criadas/verificadas.');

  // Estudantes
  const estudantesData = [
    {
      id: '33333333-3333-3333-3333-333333333333',
      matricula: 20260001,
      nomeCompleto: 'Lucas Almeida Santos',
      dataNascimento: new Date('2016-04-15'),
      cpf: '222.222.222-22',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Lucas',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: turmaAlpha.id }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: tea.id } },
          },
        ],
      },
    },
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      matricula: 202601,
      nomeCompleto: 'Ana Silva',
      dataNascimento: new Date('2019-05-15'),
      cpf: '123.456.789-01',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ana',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: turma1.id }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: tea.id } },
          },
        ],
      },
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      matricula: 202602,
      nomeCompleto: 'Bruno Santos',
      dataNascimento: new Date('2018-08-22'),
      cpf: '234.567.890-12',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bruno',
      formaComunicacao: Fcom.NAO_VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: turma1.id }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: tea.id } },
          },
        ],
      },
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      matricula: 202603,
      nomeCompleto: 'Carlos Souza',
      dataNascimento: new Date('2018-03-10'),
      cpf: '345.678.901-23',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Carlos',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: turma2.id }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: tdah.id } },
          },
        ],
      },
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      matricula: 202604,
      nomeCompleto: 'Daniela Lima',
      dataNascimento: new Date('2020-11-05'),
      cpf: '456.789.012-34',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Daniela',
      formaComunicacao: Fcom.COMUNICACAO_ALTERNATIVA,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: turma3.id }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: down.id } },
          },
        ],
      },
    },
  ];

  for (const est of estudantesData) {
    await prisma.estudante.upsert({
      where: { matricula: est.matricula },
      update: {},
      create: est,
    });
  }

  console.log('Estudantes criados e vinculados às turmas.');

  console.log('\n Seed concluído com sucesso!');
  console.log('─────────────────────────────────────────');
  console.log(' COORDENAÇÃO:');
  console.log('  Email : admin@escola.elo');
  console.log('  Senha : Admin@1234');
  console.log(' ───────────────────────────────────────');
  console.log(' PROFESSOR REGENTE:');
  console.log('  Email : professor@escola.elo');
  console.log('  Senha : Prof@1234');
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
