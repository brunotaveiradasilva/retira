import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { empresaAtualId } from "./empresa-atual";
import { prisma } from "./prisma";

// As telas continuam chamando listarMateriais(), buscarColaborador()...
// O que mudou da fase 1 pra cá: o corpo das funções agora consulta o Postgres,
// e todas viraram async (banco demora; quem chama precisa de await).
//
// REGRA DE OURO: toda consulta filtra por empresaId. Uma empresa nunca vê dados de outra.

// ---------- empréstimos ----------

// O que trazer junto com cada empréstimo (o "JOIN" do Prisma).
// `satisfies` confere o formato sem perder o tipo exato do objeto.
const comDetalhes = {
  colaborador: true,
  itens: { include: { material: true } },
} satisfies Prisma.EmprestimoInclude;

/** Empréstimo com colaborador e itens (cada item com seu material). */
export type EmprestimoDetalhado = Prisma.EmprestimoGetPayload<{
  include: typeof comDetalhes;
}>;

type FiltroEmprestimos = {
  colaboradorId?: string;
  materialId?: string;
  /** true = só abertos/parciais, false = só devolvidos, vazio = todos */
  abertos?: boolean;
};

export async function listarEmprestimos(
  filtro: FiltroEmprestimos = {},
): Promise<EmprestimoDetalhado[]> {
  const empresaId = await empresaAtualId();

  return prisma.emprestimo.findMany({
    where: {
      empresaId,
      colaboradorId: filtro.colaboradorId,
      // Empréstimos que têm PELO MENOS UM item deste material.
      itens: filtro.materialId
        ? { some: { materialId: filtro.materialId } }
        : undefined,
      status:
        filtro.abertos === true
          ? { not: "DEVOLVIDO" }
          : filtro.abertos === false
            ? "DEVOLVIDO"
            : undefined,
    },
    include: comDetalhes,
    orderBy: { retiradoEm: "desc" },
  });
}

// ---------- tipos ----------

export async function listarTipos() {
  const empresaId = await empresaAtualId();
  return prisma.tipoMaterial.findMany({
    where: { empresaId },
    // _count: o Prisma conta os materiais de cada tipo sem trazer os materiais.
    include: { _count: { select: { materiais: true } } },
    orderBy: { nome: "asc" },
  });
}

// ---------- materiais ----------

export async function listarMateriais() {
  const empresaId = await empresaAtualId();
  return prisma.material.findMany({
    where: { empresaId },
    include: { tipo: true },
    orderBy: { nome: "asc" },
  });
}

// O tipo de retorno sai da própria função: "um item da lista que listarMateriais devolve".
export type MaterialComTipo = Awaited<
  ReturnType<typeof listarMateriais>
>[number];

// findFirst (e não findUnique) porque filtramos por id E empresaId:
// um id de outra empresa simplesmente não é encontrado.
export async function buscarMaterial(id: string) {
  const empresaId = await empresaAtualId();
  return prisma.material.findFirst({
    where: { id, empresaId },
    include: { tipo: true },
  });
}

/**
 * Quantas unidades de cada material estão fora agora.
 * groupBy = GROUP BY do SQL: agrupa os itens por material e soma as quantidades.
 */
export async function unidadesEmprestadasPorMaterial(): Promise<
  Map<string, number>
> {
  const empresaId = await empresaAtualId();
  const grupos = await prisma.itemEmprestimo.groupBy({
    by: ["materialId"],
    where: {
      devolvidoEm: null,
      emprestimo: { empresaId, status: { not: "DEVOLVIDO" } },
    },
    _sum: { quantidade: true },
  });
  // Map: estrutura chave → valor. map.get("id") devolve a soma (ou undefined).
  return new Map(
    grupos.map((grupo) => [grupo.materialId, grupo._sum.quantidade ?? 0]),
  );
}

// ---------- colaboradores ----------

export async function listarColaboradores() {
  const empresaId = await empresaAtualId();
  return prisma.colaborador.findMany({
    where: { empresaId },
    // Traz junto só os empréstimos em aberto, com os itens: é o que o cartão mostra.
    include: {
      emprestimos: {
        where: { status: { not: "DEVOLVIDO" } },
        include: { itens: true },
      },
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });
}

export async function buscarColaborador(id: string) {
  const empresaId = await empresaAtualId();
  return prisma.colaborador.findFirst({ where: { id, empresaId } });
}

// ---------- retirada ----------

export async function buscarEmprestimo(id: string) {
  const empresaId = await empresaAtualId();
  return prisma.emprestimo.findFirst({
    where: { id, empresaId },
    include: {
      colaborador: true,
      itens: {
        include: { material: { include: { tipo: true } } },
        orderBy: { material: { nome: "asc" } },
      },
      empresa: { select: { nome: true, cnpj: true } },
    },
  });
}

/** O que o formulário de retirada precisa: quem pode retirar e o que pode sair. */
export async function opcoesDeRetirada() {
  const empresaId = await empresaAtualId();
  const [colaboradores, materiais, emprestadas] = await Promise.all([
    prisma.colaborador.findMany({
      where: { empresaId, ativo: true },
      select: { id: true, nome: true, setor: true },
      orderBy: { nome: "asc" },
    }),
    prisma.material.findMany({
      where: { empresaId, estado: "BOM" },
      select: {
        id: true,
        nome: true,
        codigo: true,
        controle: true,
        quantidade: true,
      },
      orderBy: { nome: "asc" },
    }),
    unidadesEmprestadasPorMaterial(),
  ]);

  return {
    colaboradores,
    // Só o que tem pelo menos 1 unidade livre, já com o "disponível" calculado.
    materiais: materiais
      .map(({ quantidade, ...material }) => ({
        ...material,
        disponivel: quantidade - (emprestadas.get(material.id) ?? 0),
      }))
      .filter((material) => material.disponivel > 0),
  };
}

export type OpcoesDeRetirada = Awaited<ReturnType<typeof opcoesDeRetirada>>;

// ---------- painel ----------

export async function resumoDoPainel(hoje: Date) {
  const empresaId = await empresaAtualId();
  const abertos = { empresaId, status: { not: "DEVOLVIDO" as const } };

  // Promise.all dispara as 4 consultas AO MESMO TEMPO e espera todas.
  // Uma depois da outra levaria a soma dos tempos; assim leva o tempo da mais lenta.
  const [emprestimosAbertos, atrasados, unidades, colaboradores] =
    await Promise.all([
      prisma.emprestimo.count({ where: abertos }),
      prisma.emprestimo.count({
        where: { ...abertos, previsaoDevolucao: { lt: hoje } },
      }),
      prisma.itemEmprestimo.aggregate({
        where: { devolvidoEm: null, emprestimo: abertos },
        _sum: { quantidade: true },
      }),
      prisma.emprestimo.findMany({
        where: abertos,
        distinct: ["colaboradorId"],
        select: { colaboradorId: true },
      }),
    ]);

  return {
    emprestimosAbertos,
    atrasados,
    unidadesFora: unidades._sum.quantidade ?? 0,
    colaboradoresComMaterial: colaboradores.length,
  };
}
