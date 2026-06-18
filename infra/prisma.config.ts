/// <reference types="node" />
import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';
import { resolve } from 'path';


config({ path: resolve(__dirname, '../apps/api/.env') });

export default defineConfig({
  schema: 'infra/prisma/schema.prisma',
  migrations: {
    path: 'infra/prisma/migrations',
    seed: 'tsx infra/prisma/seed/index.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});