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
  StatusAula
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

  console.log('Limpando dados anteriores...');
  await prisma.documentoDiagnostico.deleteMany();
  await prisma.estudanteDiagnostico.deleteMany();
  await prisma.estudanteResponsavel.deleteMany();
  await prisma.estudanteEspecificidade.deleteMany();
  await prisma.estudanteMedicamento.deleteMany();
  await prisma.registroDiario.deleteMany();
  await prisma.registroAula.deleteMany();
  await prisma.aula.deleteMany();
  await prisma.estudoCaso.deleteMany();
  await prisma.pibi.deleteMany();
  await prisma.metaDesenvolvimento.deleteMany();
  await prisma.relatorioSemestral.deleteMany();
  await prisma.estudante.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.diagnostico.deleteMany();
  console.log('Limpeza concluída.');

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

  // Usuário Admin (COORDENADOR)
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

  // Educador (Professor Regente)
  const educador = await prisma.educador.upsert({
    where: { id: '123e4567-e89b-42d3-8456-426614174001' },
    update: {},
    create: {
      id: '123e4567-e89b-42d3-8456-426614174001',
      matricula: 'REG-2026',
      nome: 'Cláudio Xavier',
      cpf: '111.111.111-11',
      dataContratacao: new Date('2024-02-10'),
      tipo: TipoEducador.REGENTE,
      telefone: '(21) 98888-5555',
      escolaId: escola.id,
    },
  });
  console.log(` Educador criado: "${educador.nome}" (id: ${educador.id})`);

  // Criar Usuário do tipo PROFESSOR vinculado ao Educador
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
      role: Role.PROFESSOR_REGENTE,
      educadorId: educador.id,
    },
  });
  console.log(` Usuário do Educador criado: "${usuarioProfessor.email}"`);

  // Educador (Professor Regente - Mariana)
  const educadorMariana = await prisma.educador.upsert({
    where: { id: '123e4567-e89b-42d3-8456-426614174002' },
    update: {},
    create: {
      id: '123e4567-e89b-42d3-8456-426614174002',
      matricula: 'REG-2026-M',
      nome: 'Mariana Costa Ribeiro',
      cpf: '111.111.111-22',
      dataContratacao: new Date('2024-03-01'),
      tipo: TipoEducador.REGENTE,
      telefone: '(21) 97777-5555',
      escolaId: escola.id,
    },
  });
  console.log(` Educador criado: "${educadorMariana.nome}" (id: ${educadorMariana.id})`);

  const senhaMarianaHash = await bcrypt.hash('Prof@1234', SALT_ROUNDS);
  const usuarioMariana = await prisma.usuario.upsert({
    where: { email: 'mariana@escola.elo' },
    update: {
      senha: senhaMarianaHash,
      educadorId: educadorMariana.id
    },
    create: {
      email: 'mariana@escola.elo',
      senha: senhaMarianaHash,
      role: Role.PROFESSOR_REGENTE,
      educadorId: educadorMariana.id,
    },
  });
  console.log(` Usuário da Educadora criado: "${usuarioMariana.email}"`);

  // Turma (tipo REGENCIA) ligando Escola, Educador
  const turmaAlpha = await prisma.turma.upsert({
    where: { id: '44444444-4444-4444-4444-444444444444' },
    update: { educadorId: educador.id },
    create: {
      id: '44444444-4444-4444-4444-444444444444',
      escolaId: escola.id,
      educadorId: educador.id,
      nome: '1º Ano A ',
      turno: Turno.MATUTINO,
      anoLetivo: 2026,
      etapa: Etapa.ETAPA_1,
      tipo: TipoTurma.REGENCIA,
    },
  });
  console.log(` Turma criada: "${turmaAlpha.nome}" (Tipo: ${turmaAlpha.tipo})`);

  // ==========================================
  // POPULANDO CRONOGRAMA DE AULAS
  // ==========================================
  console.log('\nPopulando cronograma de rotina de aulas...');

  const criarDataComHorario = (horaStr: string): Date => {
    return new Date(`1970-01-01T${horaStr}:00.000Z`);
  };

  const aulaSegunda = await prisma.aula.create({
    data: {
      id: '55555555-5555-5555-5555-555555555501',
      turmaId: turmaAlpha.id,
      educadorId: educador.id,
      diaSemana: DiaSemana.SEGUNDA,
      horarioInicio: criarDataComHorario('08:00'),
      horarioFim: criarDataComHorario('12:00'),
    }
  });

  const aulaTerca = await prisma.aula.create({
    data: {
      id: '55555555-5555-5555-5555-555555555502',
      turmaId: turmaAlpha.id,
      educadorId: educador.id,
      diaSemana: DiaSemana.TERCA,
      horarioInicio: criarDataComHorario('08:00'),
      horarioFim: criarDataComHorario('12:00'),
    }
  });

  const aulaQuarta = await prisma.aula.create({
    data: {
      id: '55555555-5555-5555-5555-555555555503',
      turmaId: turmaAlpha.id,
      educadorId: educador.id,
      diaSemana: DiaSemana.QUARTA,
      horarioInicio: criarDataComHorario('08:00'),
      horarioFim: criarDataComHorario('12:00'),
    }
  });
  console.log(' Cronograma de rotina semanal injetado.');

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

  // Turmas Adicionais
  const turma1 = await prisma.turma.upsert({
    where: { id: 'b0000000-0000-0000-0000-000000000001' },
    update: { educadorId: educador.id },
    create: {
      id: 'b0000000-0000-0000-0000-000000000001',
      escolaId: escola.id,
      educadorId: educador.id,
      nome: '1º Ano B',
      turno: Turno.VESPERTINO,
      anoLetivo: 2026,
      etapa: Etapa.ETAPA_1,
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
      etapa: Etapa.ETAPA_1,
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
      etapa: Etapa.ETAPA_2,
      tipo: TipoTurma.REGENCIA,
    },
  });
  console.log('Turmas criadas/verificadas.');

  // Estudantes
  const estudantesData = [
    {
      id: '123e4567-e89b-42d3-8456-426614174000',
      matricula: '20260001',
      nomeCompleto: 'Lucas Almeida Santos',
      dataNascimento: new Date('2016-04-15'),
      cpf: '222.222.222-22',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=lucasM1',
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
      id: '123e4567-e89b-42d3-8456-426614174001',
      matricula: '202601',
      nomeCompleto: 'Ana Silva',
      dataNascimento: new Date('2019-05-15'),
      cpf: '123.456.789-01',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=anaF1',
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
      id: '123e4567-e89b-42d3-8456-426614174002',
      matricula: '202602',
      nomeCompleto: 'Bruno Santos',
      dataNascimento: new Date('2018-08-22'),
      cpf: '234.567.890-12',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=brunoM1',
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
      id: '123e4567-e89b-42d3-8456-426614174003',
      matricula: '202603',
      nomeCompleto: 'Carlos Souza',
      dataNascimento: new Date('2018-03-10'),
      cpf: '345.678.901-23',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=carlosM1',
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
      id: '123e4567-e89b-42d3-8456-426614174004',
      matricula: '202604',
      nomeCompleto: 'Daniela Lima',
      dataNascimento: new Date('2020-11-05'),
      cpf: '456.789.012-34',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=danielaF1',
      formaComunicacao: Fcom.NAO_VERBAL,
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

    {
      id: '123e4567-e89b-42d3-8456-426614174005',
      matricula: '202605',
      nomeCompleto: 'Eduardo Martins Rocha',
      dataNascimento: new Date('2018-05-15'),
      cpf: '005.005.005-00',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=eduardoF0',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: '44444444-4444-4444-4444-444444444444' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000001' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174006',
      matricula: '202606',
      nomeCompleto: 'Fernanda Costa Ribeiro',
      dataNascimento: new Date('2018-05-15'),
      cpf: '006.006.006-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=fernandaM1',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: '44444444-4444-4444-4444-444444444444' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000002' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174007',
      matricula: '202607',
      nomeCompleto: 'Gabriel Lima Silva',
      dataNascimento: new Date('2018-05-15'),
      cpf: '007.007.007-00',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=gabrielF2',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: '44444444-4444-4444-4444-444444444444' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000003' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174008',
      matricula: '202608',
      nomeCompleto: 'Helena Souza',
      dataNascimento: new Date('2018-05-15'),
      cpf: '008.008.008-00',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=helenaF3',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: '44444444-4444-4444-4444-444444444444' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000001' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174009',
      matricula: '202609',
      nomeCompleto: 'Igor Santos',
      dataNascimento: new Date('2018-05-15'),
      cpf: '009.009.009-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=igorM4',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: '44444444-4444-4444-4444-444444444444' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000002' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-42661417400a',
      matricula: '202610',
      nomeCompleto: 'Julia Ferreira',
      dataNascimento: new Date('2018-05-15'),
      cpf: '010.010.010-00',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=juliaF5',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: '44444444-4444-4444-4444-444444444444' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000003' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-42661417400b',
      matricula: '202611',
      nomeCompleto: 'Kauan Oliveira',
      dataNascimento: new Date('2018-05-15'),
      cpf: '011.011.011-00',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=kauanF6',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000001' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000001' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-42661417400c',
      matricula: '202612',
      nomeCompleto: 'Leticia Costa',
      dataNascimento: new Date('2018-05-15'),
      cpf: '012.012.012-00',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=leticiaF7',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000001' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000002' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-42661417400d',
      matricula: '202613',
      nomeCompleto: 'Matheus Almeida',
      dataNascimento: new Date('2018-05-15'),
      cpf: '013.013.013-00',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=matheusF8',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000001' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000003' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-42661417400e',
      matricula: '202614',
      nomeCompleto: 'Natalia Pereira',
      dataNascimento: new Date('2018-05-15'),
      cpf: '014.014.014-00',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=nataliaF9',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000001' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000001' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-42661417400f',
      matricula: '202615',
      nomeCompleto: 'Otavio Mendes',
      dataNascimento: new Date('2018-05-15'),
      cpf: '015.015.015-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=otavioM10',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000001' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000002' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174010',
      matricula: '202616',
      nomeCompleto: 'Paula Rodrigues',
      dataNascimento: new Date('2018-05-15'),
      cpf: '016.016.016-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=paulaM11',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000001' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000003' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174011',
      matricula: '202617',
      nomeCompleto: 'Rafael Cunha',
      dataNascimento: new Date('2018-05-15'),
      cpf: '017.017.017-00',
      sexo: Sexo.FEMININO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=rafaelF12',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000002' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000001' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174012',
      matricula: '202618',
      nomeCompleto: 'Sara Alves',
      dataNascimento: new Date('2018-05-15'),
      cpf: '018.018.018-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=saraM13',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000002' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000002' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174013',
      matricula: '202619',
      nomeCompleto: 'Tiago Monteiro',
      dataNascimento: new Date('2018-05-15'),
      cpf: '019.019.019-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=tiagoM14',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000002' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000003' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174014',
      matricula: '202620',
      nomeCompleto: 'Ursula Castro',
      dataNascimento: new Date('2018-05-15'),
      cpf: '020.020.020-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=ursulaM15',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000002' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000001' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174015',
      matricula: '202621',
      nomeCompleto: 'Vitor Campos',
      dataNascimento: new Date('2018-05-15'),
      cpf: '021.021.021-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=vitorM16',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000002' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000002' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174016',
      matricula: '202622',
      nomeCompleto: 'Yasmim Martins',
      dataNascimento: new Date('2018-05-15'),
      cpf: '022.022.022-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=yasmimM17',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000002' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000003' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174017',
      matricula: '202623',
      nomeCompleto: 'Zeca Pagodinho',
      dataNascimento: new Date('2018-05-15'),
      cpf: '023.023.023-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=zecaM18',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000003' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000001' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174018',
      matricula: '202624',
      nomeCompleto: 'Alice Nunes',
      dataNascimento: new Date('2018-05-15'),
      cpf: '024.024.024-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=aliceM19',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000003' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000002' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-426614174019',
      matricula: '202625',
      nomeCompleto: 'Breno Farias',
      dataNascimento: new Date('2018-05-15'),
      cpf: '025.025.025-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=brenoM20',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000003' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000003' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-42661417401a',
      matricula: '202626',
      nomeCompleto: 'Cecilia Machado',
      dataNascimento: new Date('2018-05-15'),
      cpf: '026.026.026-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=ceciliaM21',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000003' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000001' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-42661417401b',
      matricula: '202627',
      nomeCompleto: 'Davi Borges',
      dataNascimento: new Date('2018-05-15'),
      cpf: '027.027.027-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=daviM22',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000003' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000002' } },
          },
        ],
      },
    },
    {
      id: '123e4567-e89b-42d3-8456-42661417401c',
      matricula: '202628',
      nomeCompleto: 'Eva Peixoto',
      dataNascimento: new Date('2018-05-15'),
      cpf: '028.028.028-00',
      sexo: Sexo.MASCULINO,
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=evaM23',
      formaComunicacao: Fcom.VERBAL,
      statusMatricula: true,
      escolaId: escola.id,
      turmas: { connect: [{ id: 'b0000000-0000-0000-0000-000000000003' }] },
      diagnosticos: {
        create: [
          {
            diagnostico: { connect: { id: 'a0000000-0000-0000-0000-000000000003' } },
          },
        ],
      },
    }
  ];

  for (const est of estudantesData) {
    await prisma.estudante.upsert({
      where: { matricula: est.matricula },
      update: { foto: est.foto },
      create: est,
    });
  }

  // ==========================================
  // POPULANDO DADOS DE SAÚDE
  // ==========================================
  console.log('Populando dados de saúde para testes...');

  const alergiaAmendoim = await prisma.especificidade.create({
    data: {
      tipo: TipoEspecificidade.RESTRICAO,
      descricao: 'Alergia severa a amendoim',
      categoria: CategoriaEspecificidade.ALIMENTAR,
    },
  });

  const risperidona = await prisma.medicamento.create({
    data: {
      nome: 'Risperidona',
    },
  });

  const lucasId = '123e4567-e89b-42d3-8456-426614174000';

  await prisma.estudanteEspecificidade.create({
    data: {
      estudanteId: lucasId,
      especificidadeId: alergiaAmendoim.id,
      obsReacao: 'Em caso de contato, apresenta manchas vermelhas e falta de ar. Ligar para emergência imediatamente.',
    },
  });

  await prisma.estudanteMedicamento.create({
    data: {
      estudanteId: lucasId,
      medicamentoId: risperidona.id,
      dosagem: 1.5,
      unidadeMedida: UnidadeM.ML,
      intervaloAdministracao: 12,
      horarioAdministrado: new Date('2026-01-01T13:00:00.000Z'),
      administradoEscola: true,
    },
  });

  await prisma.documentoDiagnostico.create({
    data: {
      id: '77777777-7777-7777-7777-777777777777',
      tipo: TipoDocumento.LAUDO_MEDICO,
      arquivo: 'http://localhost:3000/api/v1/uploads/laudos/1781883929415-924710107.pdf',
      dataEmissao: new Date('2025-02-10'),
      estudanteId: lucasId,
      diagnosticoId: tea.id,
    },
  });

  console.log('Dados de saúde de teste populados com sucesso.');

  // ==========================================
  // POPULANDO HISTÓRICO PADRONIZADO PARA TODOS OS ESTUDANTES (90 DIAS)
  // ==========================================
  console.log('\nPopulando histórico de registros diários para os gráficos...');

  const registrosDiariosMock: any[] = [];
  const registrosAulasMock: any[] = [];

  const dataReferencia = new Date();

  const hoje = new Date(Date.UTC(
    dataReferencia.getFullYear(),
    dataReferencia.getMonth(),
    dataReferencia.getDate(),
    12, 0, 0
  ));

  const gerarNotaAleatoria = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  // Todos os 5 estudantes recebem o mesmo histórico padronizado (>30 dias).
  const todosEstudantesIds = estudantesData.map((est) => est.id);

  // Dias -3 a -89 (mais de 30 dias úteis de histórico) preenchidos para TODOS os
  // estudantes. Os dias "hoje" (i=0) e "ontem" (i=1) ficam pendentes (ver bloco
  // seguinte), simulando o fluxo real em que a rotina do dia ainda não foi preenchida.
  for (let i = 2; i < 90; i++) {
    const dataRegistro = new Date(hoje);
    dataRegistro.setUTCDate(hoje.getUTCDate() - i);

    const diaDaSemana = dataRegistro.getUTCDay();

    if (diaDaSemana === 0 || diaDaSemana === 6) continue; // Pula fins de semana

    for (const estudanteId of todosEstudantesIds) {
      registrosDiariosMock.push({
        estudanteId,
        educadorId: educador.id,
        data: dataRegistro,
        scoreComportamento: gerarNotaAleatoria(3, 5),
        scoreInteracao: gerarNotaAleatoria(2, 5),
        scoreFoco: gerarNotaAleatoria(3, 5),
        scoreAutonomia: gerarNotaAleatoria(2, 5),
        statusAlimentacao: gerarNotaAleatoria(4, 5),
        usoBanheiro: gerarNotaAleatoria(3, 5),
        preenchido: true,
        anotacoes: 'Registro diário de dias úteis gerado automaticamente via seed script.',
      });
    }

    // Injetando Ocorrência da Aula do Dia (apenas Turma Alpha/Lucas possui
    // cronograma de aulas cadastrado nesta seed)
    let aulaDoDiaId: string | null = null;
    if (diaDaSemana === 1) aulaDoDiaId = aulaSegunda.id;
    if (diaDaSemana === 2) aulaDoDiaId = aulaTerca.id;
    if (diaDaSemana === 3) aulaDoDiaId = aulaQuarta.id;

    if (aulaDoDiaId) {
      let status: StatusAula = StatusAula.REALIZADA;
      let estevePresente = Math.random() > 0.12;

      if (i % 25 === 0) {
        status = StatusAula.FERIADO;
        estevePresente = false;
      } else if (i % 40 === 0) {
        status = StatusAula.FALTA_EDUCADOR;
        estevePresente = false;
      }

      registrosAulasMock.push({
        id: `99999999-9999-9999-9999-99998888${String(i).padStart(6, '0')}`,
        estudanteId: lucasId,
        aulaId: aulaDoDiaId,
        data: dataRegistro,
        status_aula: status,
        presenca: estevePresente,
        scoreParticipacao: status === StatusAula.REALIZADA && estevePresente ? gerarNotaAleatoria(3, 5) : null,
        scoreSuporte: status === StatusAula.REALIZADA && estevePresente ? gerarNotaAleatoria(1, 3) : null,
      });
    }
  }

  await prisma.registroDiario.createMany({
    data: registrosDiariosMock,
  });
  console.log(` ${registrosDiariosMock.length} registros diários (Segunda a Sexta) criados para ${todosEstudantesIds.length} estudantes.`);

  await prisma.registroAula.createMany({
    data: registrosAulasMock,
  });
  console.log(` ${registrosAulasMock.length} registros de aula criados para o Lucas (Turma Alpha).`);

  // ==========================================
  // POPULANDO REGISTROS PENDENTES (HOJE E ONTEM) PARA TODOS OS ESTUDANTES
  // ==========================================
  console.log('\nPopulando registros pendentes de hoje/ontem para testes do modal e dashboard...');

  const dataOntem = new Date(hoje);
  dataOntem.setUTCDate(hoje.getUTCDate() - 1);

  const registrosPendentesMock: any[] = [];
  for (const dataPendente of [dataOntem, hoje]) {
    const diaDaSemana = dataPendente.getUTCDay();
    if (diaDaSemana === 0 || diaDaSemana === 6) continue; // Pula fins de semana

    for (const estudanteId of todosEstudantesIds) {
      registrosPendentesMock.push({
        estudanteId,
        educadorId: educador.id,
        data: dataPendente,
        // Scores zerados pois a rotina ainda não foi preenchida
        scoreComportamento: 0,
        scoreInteracao: 0,
        scoreFoco: 0,
        scoreAutonomia: 0,
        statusAlimentacao: 0,
        usoBanheiro: 0,
        preenchido: false,      // O gatilho principal para ser considerado pendente
      });
    }
  }

  await prisma.registroDiario.createMany({
    data: registrosPendentesMock,
  });

  console.log(` ${registrosPendentesMock.length} registros pendentes criados com sucesso.`);

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