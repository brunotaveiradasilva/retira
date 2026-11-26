import type { Emprestimo, ItemEmprestimo, Material } from "@/types";

// Regras puras: recebem dados e devolvem uma resposta. Não falam com o banco.
// Por isso dá pra usar em qualquer tela e, na fase 7, testar sem precisar de banco.

// Pick<Tipo, "campo"> = só os campos que a função usa. Assim ela aceita um
// Emprestimo completo, um com relações incluídas, ou um objeto montado num teste.

export function estaAberto(emprestimo: Pick<Emprestimo, "status">): boolean {
  return emprestimo.status !== "DEVOLVIDO";
}

export function estaAtrasado(
  emprestimo: Pick<Emprestimo, "status" | "previsaoDevolucao">,
  hoje: Date,
): boolean {
  if (!estaAberto(emprestimo) || !emprestimo.previsaoDevolucao) return false;
  return emprestimo.previsaoDevolucao < hoje;
}

/** Soma as unidades que ainda não voltaram (opcionalmente só de um material). */
export function unidadesPendentes(
  emprestimos: {
    status: Emprestimo["status"];
    itens: Pick<ItemEmprestimo, "materialId" | "quantidade" | "devolvidoEm">[];
  }[],
  materialId?: string,
): number {
  return emprestimos
    .filter(estaAberto)
    .flatMap((emprestimo) => emprestimo.itens)
    .filter((item) => !item.devolvidoEm)
    .filter((item) => !materialId || item.materialId === materialId)
    .reduce((soma, item) => soma + item.quantidade, 0);
}

/** Quantas unidades podem sair agora. Material que não está BOM não sai. */
export function quantidadeDisponivel(
  material: Pick<Material, "estado" | "quantidade">,
  emprestado: number,
): number {
  if (material.estado !== "BOM") return 0;
  return Math.max(material.quantidade - emprestado, 0);
}
