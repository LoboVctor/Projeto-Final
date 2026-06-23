/// <reference types="node" />
import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from './generated/prisma';


config({ path: resolve(__dirname, '../apps/api/.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});