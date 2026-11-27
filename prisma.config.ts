// Configuração do Prisma CLI (migrate, generate, seed, studio).
// O Prisma 7 não lê o .env sozinho: o dotenv/config carrega o DATABASE_URL.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // `npm run db:seed` (e o `prisma migrate reset`) rodam este comando.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // O CLI (migrate, studio) usa a conexão DIRETA quando existir. No Neon, a
    // DATABASE_URL do site passa por um "pooler" (bom pra muitas conexões curtas),
    // mas as migrations precisam falar direto com o banco. Localmente só há uma URL.
    url: process.env.DIRECT_URL ?? env("DATABASE_URL"),
    // Banco descartável que o `migrate dev` usa pra comparar migrations.
    // O `prisma dev` já oferece um (porta 51215). Em produção não é usado.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
