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

const UM_DIA_MS = 24 * 60 * 60 * 1000;

/** Há quantos dias está atrasado (0 se não está). Conta dias inteiros, arredondando pra cima. */
export function diasDeAtraso(
  emprestimo: Pick<Emprestimo, "status" | "previsaoDevolucao">,
  hoje: Date,
): number {
  if (!estaAtrasado(emprestimo, hoje) || !emprestimo.previsaoDevolucao)
    return 0;
  return Math.ceil(
    (hoje.getTime() - emprestimo.previsaoDevolucao.getTime()) / UM_DIA_MS,
  );
}

/** Vence (ainda não venceu) dentro dos próximos `dias` dias? */
export function venceEmBreve(
  emprestimo: Pick<Emprestimo, "status" | "previsaoDevolucao">,
  hoje: Date,
  dias = 3,
): boolean {
  if (!estaAberto(emprestimo) || !emprestimo.previsaoDevolucao) return false;
  const limite = new Date(hoje.getTime() + dias * UM_DIA_MS);
  return (
    emprestimo.previsaoDevolucao >= hoje &&
    emprestimo.previsaoDevolucao <= limite
  );
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
