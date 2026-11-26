import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { lerSessao, type SessaoAtual } from "./sessao";

// DATA ACCESS LAYER: todo acesso a dados passa por aqui pra saber QUEM está pedindo.
//
// Na fase 2/3 esta função devolvia "a primeira empresa do banco".
// Agora vem do usuário logado. Como TODAS as consultas e actions já chamavam
// empresaAtualId(), trocar só este arquivo protegeu o sistema inteiro.

/** O usuário logado. Se não houver sessão válida, manda pro /login (e para a execução). */
export async function usuarioLogado(): Promise<SessaoAtual["usuario"]> {
  // lerSessao() lê o cookie: isso já diz ao Next que depende da requisição
  // (por isso não precisamos mais do connection() aqui).
  const sessao = await lerSessao();
  if (!sessao) redirect("/login");
  return sessao.usuario;
}

/** Id da empresa do usuário logado. Toda consulta filtra por ele. */
export async function empresaAtualId(): Promise<string> {
  const usuario = await usuarioLogado();
  return usuario.empresa.id;
}

/** Data e hora atuais, lidas na hora da requisição (não no build). */
export async function agora(): Promise<Date> {
  await connection();
  return new Date();
}
