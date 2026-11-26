import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DevolucaoInput, RetiradaInput } from "@/schemas/emprestimo";
import { RegraDeNegocioError } from "./erros";

// O CORAÇÃO DO SISTEMA: retirada e devolução.
//
// As duas operações mexem em várias linhas ao mesmo tempo (empréstimo, itens, material),
// então rodam dentro de uma TRANSAÇÃO: ou tudo é gravado, ou nada é.

/**
 * Registra uma retirada.
 * Regras: colaborador ativo e da empresa; material da empresa e em estado BOM;
 * unitário sai de 1 em 1; não sai mais do que está disponível; prazo não pode ser no passado.
 */
export async function registrarRetirada(
  empresaId: string,
  dados: RetiradaInput,
  agora: Date,
) {
  const previsaoDevolucao = dados.previsaoDevolucao
    ? fimDoDia(dados.previsaoDevolucao)
    : null;
  if (previsaoDevolucao && previsaoDevolucao < agora) {
    throw new RegraDeNegocioError(
      "O prazo de devolução não pode ser no passado.",
      "previsaoDevolucao",
    );
  }

  // $transaction(async (tx) => ...) — "transação interativa":
  // tudo que usar `tx` aqui dentro faz parte da mesma transação.
  return prisma.$transaction(async (tx) => {
    const colaborador = await tx.colaborador.findFirst({
      where: { id: dados.colaboradorId, empresaId },
    });
    if (!colaborador) {
      throw new RegraDeNegocioError(
        "Colaborador não encontrado.",
        "colaboradorId",
      );
    }
    if (!colaborador.ativo) {
      throw new RegraDeNegocioError(
        `${colaborador.nome} está desativado(a) e não pode retirar material.`,
        "colaboradorId",
      );
    }

    const ids = dados.itens.map((item) => item.materialId);

    // TRAVA as linhas desses materiais até o fim da transação (SELECT ... FOR UPDATE).
    // Sem isso, duas retiradas ao mesmo tempo poderiam ver "1 disponível" e levar
    // as duas a última unidade. Com a trava, a segunda espera a primeira terminar.
    // É SQL "cru": o Prisma não tem FOR UPDATE no findMany.
    await tx.$queryRaw`SELECT id FROM materiais WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;

    const materiais = await tx.material.findMany({
      where: { id: { in: ids }, empresaId },
    });
    const emprestadas = await unidadesFora(tx, ids);

    for (const item of dados.itens) {
      const material = materiais.find((m) => m.id === item.materialId);
      if (!material) {
        throw new RegraDeNegocioError("Material não encontrado.", "itens");
      }
      if (material.estado !== "BOM") {
        throw new RegraDeNegocioError(
          `"${material.nome}" não está em bom estado e não pode sair.`,
          "itens",
        );
      }
      if (material.controle === "UNITARIO" && item.quantidade !== 1) {
        throw new RegraDeNegocioError(
          `"${material.nome}" é unitário: sai 1 por vez.`,
          "itens",
        );
      }
      const disponivel =
        material.quantidade - (emprestadas.get(material.id) ?? 0);
      if (item.quantidade > disponivel) {
        throw new RegraDeNegocioError(
          disponivel === 0
            ? `"${material.nome}" não tem unidade disponível agora.`
            : `"${material.nome}": só ${disponivel} disponível(is).`,
          "itens",
        );
      }
    }

    // Tudo certo: cria o empréstimo e os itens de uma vez (nested write).
    return tx.emprestimo.create({
      data: {
        empresaId,
        colaboradorId: colaborador.id,
        retiradoEm: agora,
        previsaoDevolucao,
        observacao: dados.observacao,
        itens: {
          create: dados.itens.map((item) => ({
            materialId: item.materialId,
            quantidade: item.quantidade,
          })),
        },
      },
    });
  });
}

/**
 * Registra a devolução de alguns (ou todos) os itens de um empréstimo.
 * Itens marcados como danificados mudam o estado do material para DANIFICADO.
 */
export async function registrarDevolucao(
  empresaId: string,
  emprestimoId: string,
  dados: DevolucaoInput,
  agora: Date,
) {
  return prisma.$transaction(async (tx) => {
    const emprestimo = await tx.emprestimo.findFirst({
      where: { id: emprestimoId, empresaId },
      include: { itens: { include: { material: true } } },
    });
    if (!emprestimo)
      throw new RegraDeNegocioError("Empréstimo não encontrado.");
    if (emprestimo.status === "DEVOLVIDO") {
      throw new RegraDeNegocioError("Este empréstimo já foi devolvido.");
    }

    const pendentes = emprestimo.itens.filter((item) => !item.devolvidoEm);
    const voltando = pendentes.filter((item) =>
      dados.itemIds.includes(item.id),
    );
    if (voltando.length === 0) {
      throw new RegraDeNegocioError("Nenhum dos itens marcados está pendente.");
    }

    await tx.itemEmprestimo.updateMany({
      where: { id: { in: voltando.map((item) => item.id) } },
      data: { devolvidoEm: agora },
    });

    // Voltou quebrado → o material fica DANIFICADO e sai da lista de disponíveis.
    const danificados = voltando.filter(
      (item) =>
        dados.danificados.includes(item.id) &&
        item.material.controle === "UNITARIO",
    );
    if (danificados.length > 0) {
      await tx.material.updateMany({
        where: { id: { in: danificados.map((item) => item.materialId) } },
        data: { estado: "DANIFICADO" },
      });
    }

    // Voltou tudo? DEVOLVIDO. Voltou uma parte? PARCIAL.
    const todosVoltaram = voltando.length === pendentes.length;
    return tx.emprestimo.update({
      where: { id: emprestimo.id },
      data: { status: todosVoltaram ? "DEVOLVIDO" : "PARCIAL" },
    });
  });
}

// ---------- auxiliares ----------

/** Unidades de cada material que estão fora agora (dentro da transação). */
async function unidadesFora(
  tx: Prisma.TransactionClient,
  materialIds: string[],
): Promise<Map<string, number>> {
  const grupos = await tx.itemEmprestimo.groupBy({
    by: ["materialId"],
    where: {
      materialId: { in: materialIds },
      devolvidoEm: null,
      emprestimo: { status: { not: "DEVOLVIDO" } },
    },
    _sum: { quantidade: true },
  });
  return new Map(grupos.map((g) => [g.materialId, g._sum.quantidade ?? 0]));
}

/** "2026-12-03" → 03/12/2026 às 23:59:59 (o prazo vale até o fim do dia). */
function fimDoDia(data: string): Date {
  return new Date(`${data}T23:59:59`);
}
