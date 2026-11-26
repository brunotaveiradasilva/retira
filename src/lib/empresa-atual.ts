import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { prisma } from "./prisma";

/**
 * Id da empresa de quem está usando o sistema.
 *
 * Fase 4: vai sair da sessão do usuário logado.
 * Por enquanto: a primeira empresa cadastrada (a do seed).
 *
 * `cache` do React: se várias consultas pedirem o id na mesma requisição,
 * o banco é consultado uma vez só.
 */
export const empresaAtualId = cache(async (): Promise<string> => {
  // connection() avisa o Next: "daqui pra baixo depende da requisição, não gere no build".
  // Sem isso o build tentaria consultar o banco para montar as páginas.
  await connection();

  const empresa = await prisma.empresa.findFirst({
    orderBy: { criadoEm: "asc" },
    select: { id: true },
  });
  if (!empresa) {
    throw new Error("Nenhuma empresa no banco. Rode `npm run db:seed`.");
  }
  return empresa.id;
});

/** Data e hora atuais, lidas na hora da requisição (não no build). */
export async function agora(): Promise<Date> {
  await connection();
  return new Date();
}
