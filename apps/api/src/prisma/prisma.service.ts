import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: PrismaClient;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const adapter = new PrismaPg(pool); // adaptador do Prisma para o PostgreSQL
    
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit() {
    try {
      await this.prisma.$connect();
      this.logger.log('Conexão com o banco de dados estabelecida com sucesso.');
    } catch (error) {
      this.logger.error('Erro ao conectar ao banco de dados', error);
    }
  }

  get client() {
    return this.prisma;
  }
}