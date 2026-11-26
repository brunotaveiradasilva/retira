"use server";

import { refresh } from "next/cache";
import { executar, falhaDeValidacao } from "@/lib/acao";
import { empresaAtualId } from "@/lib/empresa-atual";
import type { Resultado } from "@/lib/resultado";
import { colaboradorSchema } from "@/schemas/colaborador";
import {
  alterarAtivo,
  atualizarColaborador,
  criarColaborador,
  excluirColaborador,
} from "@/services/colaboradores.service";

export async function salvarColaboradorAction(
  id: string | null,
  dados: unknown,
): Promise<Resultado> {
  const validacao = colaboradorSchema.safeParse(dados);
  if (!validacao.success) return falhaDeValidacao(validacao.error);

  const empresaId = await empresaAtualId();
  return executar(async () => {
    const colaborador = id
      ? await atualizarColaborador(empresaId, id, validacao.data)
      : await criarColaborador(empresaId, validacao.data);
    return {
      ok: true,
      id: colaborador.id,
      mensagem: id ? "Colaborador atualizado." : "Colaborador cadastrado.",
    };
  });
}

export async function alterarAtivoAction(
  id: string,
  ativo: boolean,
): Promise<Resultado> {
  const empresaId = await empresaAtualId();
  const resultado = await executar(async () => {
    const { aviso } = await alterarAtivo(empresaId, id, ativo);
    return {
      ok: true,
      mensagem:
        aviso ?? (ativo ? "Colaborador reativado." : "Colaborador desativado."),
    };
  });
  if (resultado.ok) refresh(); // continua na mesma página: atualiza o que está na tela
  return resultado;
}

export async function excluirColaboradorAction(id: string): Promise<Resultado> {
  const empresaId = await empresaAtualId();
  return executar(async () => {
    await excluirColaborador(empresaId, id);
    return { ok: true, mensagem: "Colaborador excluído." };
  });
}
