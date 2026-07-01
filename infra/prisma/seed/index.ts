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

  // Turma (tipo REGENCIA) ligando Escola, Educador
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
      nome: '1º Ano A',
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
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&hairVariant=spiky,flatTop,parting,shortCurls,plain&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=lucas',
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
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&hairVariant=longCurls,buns,roundBob,wavy,bangs,fluffy&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=ana',
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
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&hairVariant=spiky,flatTop,parting,shortCurls,plain&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=bruno',
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
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&hairVariant=spiky,flatTop,parting,shortCurls,plain&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=carlos',
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
      foto: 'https://api.dicebear.com/10.x/dylan/svg?facialHairVariant=&hairVariant=longCurls,buns,roundBob,wavy,bangs,fluffy&moodVariant=happy&backgroundColor=&hairColor=000000,2c1a0b,53261d,d9b380&skinColor=895129,b78b61,e1c4a3&seed=daniela',
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
  // POPULANDO HISTÓRICO PARA OS GRÁFICOS (90 DIAS)
  // ==========================================
  console.log('\nPopulando histórico de registros diários para os gráficos...');

  const registrosDiariosMock = [];
  const registrosAulasMock = [];
  
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

  for (let i = 0; i < 90; i++) {
    const dataRegistro = new Date(hoje);
    dataRegistro.setUTCDate(hoje.getUTCDate() - i);

    const diaDaSemana = dataRegistro.getUTCDay();
    
    if (diaDaSemana === 0 || diaDaSemana === 6) continue; // Pula fins de semana

    registrosDiariosMock.push({
      estudanteId: lucasId,
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

    // Injetando Ocorrência da Aula do Dia
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
  console.log(` ${registrosDiariosMock.length} registros diários (Segunda a Sexta) criados para o Lucas.`);

  await prisma.registroAula.createMany({
    data: registrosAulasMock,
  });
  console.log(` ${registrosAulasMock.length} registros de chamada históricos acoplados à rotina de aulas do estudante.`);

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