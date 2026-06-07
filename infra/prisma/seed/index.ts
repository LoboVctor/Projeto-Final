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
      escolaId: escola.id,
    },
  });

  console.log(`Admin criado: "${admin.email}" (role: ${admin.role})`);
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
