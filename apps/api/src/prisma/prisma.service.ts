import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../../../infra/generated/prisma/index.js';

@Injectable()
export class PrismaService
  implements OnModuleInit 
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly prisma: PrismaClient;

  constructor(configService: ConfigService) {
    const connectionString = configService.getOrThrow<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleInit(): Promise<void> {
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

