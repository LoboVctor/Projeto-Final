/// <reference types="node" />
import { defineConfig, env } from 'prisma/config';
import { config } from 'dotenv';
config({ path: resolve(__dirname, '.env') });
import { resolve } from 'path';


export default defineConfig({
  schema: '../../infra/prisma/schema.prisma',
  migrations: {
    path: '../../infra/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
