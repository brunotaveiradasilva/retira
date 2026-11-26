import type { Colaborador, Emprestimo, Material, TipoMaterial } from "@/types";
import {
  HOJE,
  colaboradores,
  emprestimos,
  materiais,
  tipos,
} from "./mock-data";

// Funções que "consultam" os dados falsos.
// As telas só chamam estas funções, nunca o array direto. Na fase 2 trocamos o
// corpo delas por consultas do Prisma e as telas nem percebem a diferença.

// ---------- buscas simples ----------

// Retorno "X | undefined": o .find pode não achar nada, e o TypeScript obriga a tela a tratar isso.
export function buscarMaterial(id: string): Material | undefined {
  return materiais.find((material) => material.id === id);
}

export function buscarColaborador(id: string): Colaborador | undefined {
  return colaboradores.find((colaborador) => colaborador.id === id);
}

export function buscarTipo(id: string): TipoMaterial | undefined {
  return tipos.find((tipo) => tipo.id === id);
}

export function listarMateriais(): Material[] {
  // [...array] cria uma cópia antes de ordenar: .sort altera o array original.
  return [...materiais].sort((a, b) => a.nome.localeCompare(b.nome));
}

export function listarColaboradores(): Colaborador[] {
  return [...colaboradores].sort((a, b) => a.nome.localeCompare(b.nome));
}

export function listarEmprestimos(): Emprestimo[] {
  // Mais recentes primeiro.
  return [...emprestimos].sort(
    (a, b) => b.retiradoEm.getTime() - a.retiradoEm.getTime(),
  );
}

// ---------- regras ----------

export function estaAberto(emprestimo: Emprestimo): boolean {
  return emprestimo.status !== "DEVOLVIDO";
}

export function estaAtrasado(
  emprestimo: Emprestimo,
  hoje: Date = HOJE,
): boolean {
  if (!estaAberto(emprestimo) || !emprestimo.previsaoDevolucao) return false;
  return emprestimo.previsaoDevolucao < hoje;
}

/** Quantas unidades deste material estão fora agora (itens ainda não devolvidos). */
export function quantidadeEmprestada(materialId: string): number {
  let total = 0;
  for (const emprestimo of emprestimos.filter(estaAberto)) {
    for (const item of emprestimo.itens) {
      if (item.materialId === materialId && !item.devolvidoEm) {
        total += item.quantidade;
      }
    }
  }
  return total;
}

export function quantidadeDisponivel(material: Material): number {
  if (material.estado !== "BOM") return 0;
  return material.quantidade - quantidadeEmprestada(material.id);
}

/** Empréstimos (de qualquer status) que envolvem este material. */
export function emprestimosDoMaterial(materialId: string): Emprestimo[] {
  return listarEmprestimos().filter((emprestimo) =>
    emprestimo.itens.some((item) => item.materialId === materialId),
  );
}

export function emprestimosDoColaborador(colaboradorId: string): Emprestimo[] {
  return listarEmprestimos().filter(
    (emprestimo) => emprestimo.colaboradorId === colaboradorId,
  );
}

/** Números do painel. */
export function resumoDoPainel() {
  const abertos = emprestimos.filter(estaAberto);
  return {
    emprestimosAbertos: abertos.length,
    atrasados: abertos.filter((emprestimo) => estaAtrasado(emprestimo)).length,
    unidadesFora: materiais.reduce(
      (soma, material) => soma + quantidadeEmprestada(material.id),
      0,
    ),
    colaboradoresComMaterial: new Set(abertos.map((e) => e.colaboradorId)).size,
  };
}
