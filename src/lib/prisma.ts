import "server-only"; // erro de build se alguém importar isto num Client Component
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// O Prisma 7 conversa com o Postgres por um "adapter" (aqui o driver `pg`).
function criarPrisma() {
  const connectionString = process.env.DATABASE_URL;
  // Sem isto, uma DATABASE_URL vazia faz o driver tentar "localhost" e o erro vira um
  // "DatabaseNotReachable" que não diz nada. Foi o que aconteceu no primeiro cadastro
  // em produção: a variável existia na Vercel, mas estava salva em branco.
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL não configurada (ou vazia). Local: confira o .env. Vercel: Settings → Environment Variables.",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// Em desenvolvimento o Next recarrega os módulos a cada alteração. Sem este truque,
// cada recarga abriria uma conexão nova com o banco até estourar o limite.
// Guardamos a instância em globalThis, que sobrevive às recargas.
const globalParaPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof criarPrisma>;
};

export const prisma = globalParaPrisma.prisma ?? criarPrisma();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = prisma;
