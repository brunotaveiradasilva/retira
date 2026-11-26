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
    url: env("DATABASE_URL"),
    // Banco descartável que o `migrate dev` usa pra comparar migrations.
    // O `prisma dev` já oferece um (porta 51215). Em produção não é usado.
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
