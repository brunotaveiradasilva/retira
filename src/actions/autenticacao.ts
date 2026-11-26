"use server";

import { redirect } from "next/navigation";
import { executar, falhaDeValidacao } from "@/lib/acao";
import type { Resultado } from "@/lib/resultado";
import { criarSessao, encerrarSessao } from "@/lib/sessao";
import { cadastroSchema, loginSchema } from "@/schemas/autenticacao";
import { autenticar, cadastrarEmpresa } from "@/services/autenticacao.service";

// Estas actions NÃO chamam empresaAtualId(): quem as usa ainda não está logado.

export async function entrarAction(
  _anterior: Resultado | null,
  formData: FormData,
): Promise<Resultado> {
  const valores = {
    email: String(formData.get("email") ?? ""),
    senha: String(formData.get("senha") ?? ""),
  };
  // A senha nunca volta pro navegador, nem em caso de erro.
  const devolver = { email: valores.email };

  const validacao = loginSchema.safeParse(valores);
  if (!validacao.success) {
    return { ...falhaDeValidacao(validacao.error), valores: devolver };
  }

  const resultado = await executar(async () => {
    const usuario = await autenticar(validacao.data);
    await criarSessao(usuario.id);
    return { ok: true };
  });
  if (!resultado.ok) return { ...resultado, valores: devolver };

  // redirect lança uma exceção especial: por isso fica FORA do executar (try/catch).
  redirect(destinoSeguro(formData.get("de")));
}

export async function cadastrarAction(
  _anterior: Resultado | null,
  formData: FormData,
): Promise<Resultado> {
  const valores = {
    empresaNome: String(formData.get("empresaNome") ?? ""),
    cnpj: String(formData.get("cnpj") ?? ""),
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    senha: String(formData.get("senha") ?? ""),
    confirmacao: String(formData.get("confirmacao") ?? ""),
  };
  // Devolvemos tudo MENOS as senhas.
  const devolver = {
    empresaNome: valores.empresaNome,
    cnpj: valores.cnpj,
    nome: valores.nome,
    email: valores.email,
  };

  const validacao = cadastroSchema.safeParse(valores);
  if (!validacao.success) {
    return { ...falhaDeValidacao(validacao.error), valores: devolver };
  }

  const resultado = await executar(async () => {
    const usuario = await cadastrarEmpresa(validacao.data);
    await criarSessao(usuario.id); // já entra logado
    return { ok: true };
  });
  if (!resultado.ok) return { ...resultado, valores: devolver };

  redirect("/painel");
}

export async function sairAction(): Promise<void> {
  await encerrarSessao();
  redirect("/login");
}

/**
 * Pra onde mandar depois do login. Aceita só caminhos internos ("/materiais"):
 * sem isso, um link /login?de=https://site-malicioso.com faria o Retira
 * redirecionar a pessoa pra fora logo depois de ela digitar a senha ("open redirect").
 */
function destinoSeguro(de: FormDataEntryValue | null): string {
  const caminho = typeof de === "string" ? de : "";
  return caminho.startsWith("/") && !caminho.startsWith("//")
    ? caminho
    : "/painel";
}
