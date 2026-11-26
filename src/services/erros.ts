import { Prisma } from "@/generated/prisma/client";

/**
 * Erro "esperado": uma regra do negócio foi violada (ex.: excluir tipo que tem materiais).
 * A mensagem é escrita pra pessoa que usa o sistema ler.
 * Erros de outro tipo (banco fora do ar, bug) NÃO são deste tipo e viram erro genérico.
 */
export class RegraDeNegocioError extends Error {
  constructor(
    mensagem: string,
    /** Campo do formulário ao qual o erro se refere, se houver. */
    public campo?: string,
  ) {
    super(mensagem);
    this.name = "RegraDeNegocioError";
  }
}

/** O banco recusou porque violaria um @unique / @@unique do schema (código P2002). */
export function violouUnico(erro: unknown): boolean {
  return (
    erro instanceof Prisma.PrismaClientKnownRequestError &&
    erro.code === "P2002"
  );
}
