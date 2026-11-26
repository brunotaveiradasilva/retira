import "server-only";
import { z } from "zod";
import { RegraDeNegocioError } from "@/services/erros";
import type { Falha, Resultado } from "./resultado";

// Ajudantes usados por todas as Server Actions, pra elas ficarem curtas.

/** O Zod recusou os dados: devolve os erros de cada campo. */
export function falhaDeValidacao(erro: z.ZodError): Falha {
  return {
    ok: false,
    erro: "Confira os campos destacados.",
    campos: z.flattenError(erro).fieldErrors,
  };
}

/**
 * Roda o trabalho e transforma erros em Resultado:
 * - RegraDeNegocioError → a mensagem dela (feita pra pessoa ler)
 * - qualquer outro erro → mensagem genérica (o detalhe técnico fica só no log do servidor)
 */
export async function executar(
  trabalho: () => Promise<Resultado>,
): Promise<Resultado> {
  try {
    return await trabalho();
  } catch (erro) {
    if (erro instanceof RegraDeNegocioError) {
      return {
        ok: false,
        erro: erro.message,
        campos: erro.campo ? { [erro.campo]: [erro.message] } : undefined,
      };
    }
    console.error(erro);
    return { ok: false, erro: "Não foi possível salvar. Tente de novo." };
  }
}
