"use server";

import { refresh } from "next/cache";
import { executar, falhaDeValidacao } from "@/lib/acao";
import { agora, empresaAtualId } from "@/lib/empresa-atual";
import type { Resultado } from "@/lib/resultado";
import { devolucaoSchema, retiradaSchema } from "@/schemas/emprestimo";
import {
  registrarDevolucao,
  registrarRetirada,
} from "@/services/emprestimos.service";

export async function registrarRetiradaAction(
  dados: unknown,
): Promise<Resultado> {
  const validacao = retiradaSchema.safeParse(dados);
  if (!validacao.success) return falhaDeValidacao(validacao.error);

  const [empresaId, momento] = await Promise.all([empresaAtualId(), agora()]);
  return executar(async () => {
    const emprestimo = await registrarRetirada(
      empresaId,
      validacao.data,
      momento,
    );
    return { ok: true, id: emprestimo.id, mensagem: "Retirada registrada." };
  });
}

export async function registrarDevolucaoAction(
  emprestimoId: string,
  dados: unknown,
): Promise<Resultado> {
  const validacao = devolucaoSchema.safeParse(dados);
  if (!validacao.success) return falhaDeValidacao(validacao.error);

  const [empresaId, momento] = await Promise.all([empresaAtualId(), agora()]);
  const resultado = await executar(async () => {
    const emprestimo = await registrarDevolucao(
      empresaId,
      emprestimoId,
      validacao.data,
      momento,
    );
    return {
      ok: true,
      mensagem:
        emprestimo.status === "DEVOLVIDO"
          ? "Devolução concluída."
          : "Devolução parcial registrada.",
    };
  });
  if (resultado.ok) refresh(); // continua no detalhe: redesenha com os dados novos
  return resultado;
}
