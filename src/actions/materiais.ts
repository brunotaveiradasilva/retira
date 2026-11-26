"use server";

import { executar, falhaDeValidacao } from "@/lib/acao";
import { empresaAtualId } from "@/lib/empresa-atual";
import type { Resultado } from "@/lib/resultado";
import { materialSchema } from "@/schemas/material";
import {
  atualizarMaterial,
  criarMaterial,
  excluirMaterial,
} from "@/services/materiais.service";

/**
 * Cria (id = null) ou atualiza um material.
 * `dados` é `unknown` de propósito: veio do navegador, pode ser qualquer coisa.
 * Só depois do safeParse ele vira um MaterialInput confiável.
 */
export async function salvarMaterialAction(
  id: string | null,
  dados: unknown,
): Promise<Resultado> {
  const validacao = materialSchema.safeParse(dados);
  if (!validacao.success) return falhaDeValidacao(validacao.error);

  const empresaId = await empresaAtualId();
  return executar(async () => {
    const material = id
      ? await atualizarMaterial(empresaId, id, validacao.data)
      : await criarMaterial(empresaId, validacao.data);
    return {
      ok: true,
      id: material.id,
      mensagem: id ? "Material atualizado." : "Material cadastrado.",
    };
  });
}

export async function excluirMaterialAction(id: string): Promise<Resultado> {
  const empresaId = await empresaAtualId();
  return executar(async () => {
    await excluirMaterial(empresaId, id);
    return { ok: true, mensagem: "Material excluído." };
  });
}
