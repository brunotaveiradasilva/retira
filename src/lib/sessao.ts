import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

// COMO O LOGIN FUNCIONA
//
// 1. Ao entrar, sorteamos um token aleatório (32 bytes) → vai pro COOKIE do navegador.
// 2. No banco salvamos uma Sessao cujo id é o HASH (sha256) desse token.
// 3. A cada requisição: lemos o cookie, calculamos o hash, procuramos a sessão.
//
// Por que o hash? Se alguém copiar o banco, não tem os tokens, só os hashes,
// e não consegue montar um cookie válido. (Mesma ideia da senha, mas aqui o token já é
// aleatório e longo, então um sha256 rápido basta.)

export const NOME_DO_COOKIE = "retira_sessao";
const DURACAO_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

function hashDoToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Cria a sessão no banco e grava o cookie. Só funciona em Server Action ou Route Handler. */
export async function criarSessao(usuarioId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiraEm = new Date(Date.now() + DURACAO_MS);

  await prisma.sessao.create({
    data: { id: hashDoToken(token), usuarioId, expiraEm },
  });

  const cookieStore = await cookies();
  cookieStore.set(NOME_DO_COOKIE, token, {
    httpOnly: true, // JavaScript da página não consegue ler (protege contra XSS)
    secure: process.env.NODE_ENV === "production", // só HTTPS em produção
    sameSite: "lax", // não vai em POST vindo de outro site (protege contra CSRF)
    path: "/",
    expires: expiraEm,
  });
}

/**
 * A sessão de quem está acessando, com o usuário e a empresa. null se não estiver logado.
 * `cache` do React: várias chamadas na mesma requisição = uma ida ao banco só.
 */
export const lerSessao = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_DO_COOKIE)?.value;
  if (!token) return null;

  const sessao = await prisma.sessao.findUnique({
    where: { id: hashDoToken(token) },
    include: {
      usuario: {
        // select: só o que precisamos. O senhaHash nunca sai daqui.
        select: {
          id: true,
          nome: true,
          email: true,
          papel: true,
          empresa: { select: { id: true, nome: true } },
        },
      },
    },
  });
  if (!sessao) return null;

  if (sessao.expiraEm < new Date()) {
    await prisma.sessao.delete({ where: { id: sessao.id } });
    return null;
  }
  return sessao;
});

export type SessaoAtual = NonNullable<Awaited<ReturnType<typeof lerSessao>>>;

/** Apaga a sessão (no banco e o cookie). Só em Server Action ou Route Handler. */
export async function encerrarSessao(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_DO_COOKIE)?.value;
  if (token) {
    await prisma.sessao.deleteMany({ where: { id: hashDoToken(token) } });
  }
  cookieStore.delete(NOME_DO_COOKIE);
}
