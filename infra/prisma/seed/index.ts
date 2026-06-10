import 'dotenv/config';
import { PrismaClient, Role } from '../../generated/prisma/index.js';
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
    where: { id: 'escola-elo-seed-00000000-0000' },
    update: {},
    create: {
      id: 'escola-elo-seed-00000000-0000',
      nome: 'Escola Municipal ELO',
      bairro: 'Centro',
      endereco: 'Rua das Aces, 100',
      telefone: '(21) 99999-0000',
      email: 'contato@escola.elo',
      codInep: '33000000',
    },
  });

  console.log(`Escola criada: "${escola.nome}" (id: ${escola.id})`);


  // Usuário Admin (COORDENADOR)

  const senhaHash = await bcrypt.hash('Admin@1234', SALT_ROUNDS);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@escola.elo' },
    update: {},
    create: {
      email: 'admin@escola.elo',
      senha: senhaHash,
      role: Role.COORDENADOR,
    },
  });

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
    update: {},
    create: {
      id: 'b0000000-0000-0000-0000-000000000001',
      escolaId: escola.id,
      nome: '1º Ano A',
      turno: 'VESPERTINO',
      anoLetivo: 2026,
      etapa: 'ENSINO_FUNDAMENTAL_1',
    },
  });

  const turma2 = await prisma.turma.upsert({
    where: { id: 'b0000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: 'b0000000-0000-0000-0000-000000000002',
      escolaId: escola.id,
      nome: '2º Ano B',
      turno: 'MATUTINO',
      anoLetivo: 2026,
      etapa: 'ENSINO_FUNDAMENTAL_1',
    },
  });

  const turma3 = await prisma.turma.upsert({
    where: { id: 'b0000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: 'b0000000-0000-0000-0000-000000000003',
      escolaId: escola.id,
      nome: 'Infantil IV',
      turno: 'MATUTINO',
      anoLetivo: 2026,
      etapa: 'EDUCACAO_INFANTIL',
    },
  });

  console.log('Turmas criadas/verificadas.');

  // Estudantes
  const estudantesData = [
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      matricula: 202601,
      nomeCompleto: 'Ana Silva',
      dataNascimento: new Date('2019-05-15'),
      cpf: '123.456.789-01',
      sexo: 'FEMININO' as const,
      foto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Ana',
      formaComunicacao: 'VERBAL' as const,
      statusMatricula: true,
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
      sexo: 'MASCULINO' as const,
      foto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Bruno',
      formaComunicacao: 'NAO_VERBAL' as const,
      statusMatricula: true,
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
      sexo: 'MASCULINO' as const,
      foto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Carlos',
      formaComunicacao: 'VERBAL' as const,
      statusMatricula: true,
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
      sexo: 'FEMININO' as const,
      foto: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Daniela',
      formaComunicacao: 'COMUNICACAO_ALTERNATIVA' as const,
      statusMatricula: true,
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
    await prisma.estudante.create({
      data: est,
    });
  }

  console.log('Estudantes criados e vinculados às turmas.');

  console.log('\n Seed concluído com sucesso!');
  console.log('─────────────────────────────────────────');
  console.log('  Email : admin@escola.elo');
  console.log('  Senha : Admin@1234');
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
