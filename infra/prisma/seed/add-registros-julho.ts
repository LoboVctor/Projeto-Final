import { resolve } from 'path';
import { config } from 'dotenv';
config({ path: resolve(process.cwd(), '../../apps/api/.env') });

import { PrismaClient } from '../../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not defined');
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const EDUCADOR_ID = '123e4567-e89b-42d3-8456-426614174001';

// Busca dinamicamente os estudantes do educador
async function getEstudantesDoEducador() {
  return prisma.estudante.findMany({
    where: {
      turmas: {
        some: {
          educadorId: EDUCADOR_ID,
        }
      },
      statusMatricula: true,
    },
    select: { id: true, nomeCompleto: true },
  });
}

const gerarNota = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

async function main() {
  console.log('Adicionando registros de julho de 2026...');

  const estudantes = await getEstudantesDoEducador();
  console.log(`  Encontrados ${estudantes.length} estudantes do educador.`);

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth(); // 0-indexado

  const registros: any[] = [];

  for (const est of estudantes) {
    // Todos os dias úteis do mês atual até hoje
    for (let dia = 1; dia <= hoje.getDate(); dia++) {
      const data = new Date(Date.UTC(anoAtual, mesAtual, dia, 12, 0, 0));
      const diaSemana = data.getUTCDay();
      if (diaSemana === 0 || diaSemana === 6) continue; // pula fim de semana

      const isHoje = dia === hoje.getDate();
      const preenchido = isHoje ? false : Math.random() > 0.25;

      registros.push({
        estudanteId: est.id,
        educadorId: EDUCADOR_ID,
        data,
        preenchido,
        scoreComportamento: preenchido ? gerarNota(3, 5) : 0,
        scoreInteracao: preenchido ? gerarNota(2, 5) : 0,
        scoreFoco: preenchido ? gerarNota(3, 5) : 0,
        scoreAutonomia: preenchido ? gerarNota(2, 5) : 0,
        statusAlimentacao: preenchido ? gerarNota(3, 5) : 0,
        usoBanheiro: preenchido ? gerarNota(3, 5) : 0,
      });
    }
  }

  console.log(`  Criando ${registros.length} registros...`);

  const result = await prisma.registroDiario.createMany({
    data: registros,
    skipDuplicates: true,
  });

  console.log(`✅ ${result.count} registros de julho criados com sucesso!`);
  console.log(`   (${registros.filter(r => r.preenchido).length} preenchidos, ${registros.filter(r => !r.preenchido).length} pendentes)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
