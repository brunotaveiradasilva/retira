"use server";
// ↑ Tudo que este arquivo exporta vira uma Server Action: uma função que o navegador
// chama pela rede (POST), mas que roda no servidor. Por isso pode usar o banco.

import { refresh } from "next/cache";
import { executar, falhaDeValidacao } from "@/lib/acao";
import { empresaAtualId } from "@/lib/empresa-atual";
import type { Resultado } from "@/lib/resultado";
import { tipoSchema } from "@/schemas/tipo";
import { criarTipo, excluirTipo, renomearTipo } from "@/services/tipos.service";

// Forma usada com useActionState + <form action>:
// recebe o resultado anterior e o FormData do formulário.
export async function criarTipoAction(
  _anterior: Resultado | null,
  formData: FormData,
): Promise<Resultado> {
  // O que veio do formulário (guardado pra devolver se der erro).
  const valores = { nome: String(formData.get("nome") ?? "") };

  // 1. Validar (nunca confie no navegador)
  const validacao = tipoSchema.safeParse(valores);
  if (!validacao.success) {
    return { ...falhaDeValidacao(validacao.error), valores };
  }

  // 2. Quem está pedindo (fase 4: vem do login)
  const empresaId = await empresaAtualId();

  // 3. Chamar o service
  const resultado = await executar(async () => {
    const tipo = await criarTipo(empresaId, validacao.data);
    return { ok: true, mensagem: `Tipo "${tipo.nome}" criado.` };
  });
  if (!resultado.ok) return { ...resultado, valores };

  // 4. Atualizar a tela que está aberta com os dados novos
  refresh();
  return resultado;
}

// O id vem "amarrado" com .bind(null, id) no componente; os outros dois argumentos
// são os do useActionState.
export async function renomearTipoAction(
  id: string,
  _anterior: Resultado | null,
  formData: FormData,
): Promise<Resultado> {
  const valores = { nome: String(formData.get("nome") ?? "") };
  const validacao = tipoSchema.safeParse(valores);
  if (!validacao.success) {
    return { ...falhaDeValidacao(validacao.error), valores };
  }

  const empresaId = await empresaAtualId();
  const resultado = await executar(async () => {
    await renomearTipo(empresaId, id, validacao.data);
    return { ok: true, mensagem: "Tipo renomeado." };
  });
  if (!resultado.ok) return { ...resultado, valores };
  refresh();
  return resultado;
}

export async function excluirTipoAction(id: string): Promise<Resultado> {
  const empresaId = await empresaAtualId();
  const resultado = await executar(async () => {
    await excluirTipo(empresaId, id);
    return { ok: true, mensagem: "Tipo excluído." };
  });
  if (resultado.ok) refresh();
  return resultado;
}
