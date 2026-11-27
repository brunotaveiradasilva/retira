import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { EstadoMaterial } from "@/types";
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

// ---------- lista de empréstimos com filtro e paginação ----------

export const SITUACOES = [
  "abertos",
  "atrasados",
  "devolvidos",
  "todos",
] as const;
// `typeof SITUACOES[number]` = "abertos" | "atrasados" | "devolvidos" | "todos".
// O union type sai do próprio array: mudou o array, mudou o tipo.
export type Situacao = (typeof SITUACOES)[number];

export const POR_PAGINA = 10;

type FiltroPaginado = {
  situacao: Situacao;
  /** Nome do colaborador */
  busca?: string;
  pagina: number;
  hoje: Date;
};

export async function paginarEmprestimos(filtro: FiltroPaginado) {
  const empresaId = await empresaAtualId();

  // Prisma.EmprestimoWhereInput: o tipo do `where`. Montamos o objeto por partes.
  const where: Prisma.EmprestimoWhereInput = { empresaId };
  if (filtro.situacao === "abertos") where.status = { not: "DEVOLVIDO" };
  if (filtro.situacao === "devolvidos") where.status = "DEVOLVIDO";
  if (filtro.situacao === "atrasados") {
    where.status = { not: "DEVOLVIDO" };
    where.previsaoDevolucao = { lt: filtro.hoje };
  }
  if (filtro.busca) {
    // Filtro por um campo da RELAÇÃO: empréstimos cujo colaborador tem esse nome.
    where.colaborador = {
      nome: { contains: filtro.busca, mode: "insensitive" },
    };
  }

  // Duas consultas em paralelo: a página atual e o total (pra saber quantas páginas há).
  const [itens, total] = await Promise.all([
    prisma.emprestimo.findMany({
      where,
      include: comDetalhes,
      orderBy: { retiradoEm: "desc" },
      skip: (filtro.pagina - 1) * POR_PAGINA, // OFFSET: pula as páginas anteriores
      take: POR_PAGINA, // LIMIT: quantos trazer
    }),
    prisma.emprestimo.count({ where }),
  ]);

  return {
    itens,
    total,
    totalDePaginas: Math.max(1, Math.ceil(total / POR_PAGINA)),
  };
}

// ---------- materiais ----------

export type FiltroMateriais = {
  busca?: string;
  estado?: EstadoMaterial;
};

export async function listarMateriais(filtro: FiltroMateriais = {}) {
  const empresaId = await empresaAtualId();
  return prisma.material.findMany({
    where: {
      empresaId,
      estado: filtro.estado,
      // Busca no nome OU no código. `contains` = LIKE '%texto%' do SQL;
      // mode: "insensitive" ignora maiúsculas/minúsculas (ILIKE no Postgres).
      OR: filtro.busca
        ? [
            { nome: { contains: filtro.busca, mode: "insensitive" } },
            { codigo: { contains: filtro.busca, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: { nome: "asc" },
  });
}

// findFirst (e não findUnique) porque filtramos por id E empresaId:
// um id de outra empresa simplesmente não é encontrado.
export async function buscarMaterial(id: string) {
  const empresaId = await empresaAtualId();
  return prisma.material.findFirst({ where: { id, empresaId } });
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

export type FiltroColaboradores = {
  busca?: string;
  /** false (padrão) = só ativos; true = ativos e inativos */
  incluirInativos?: boolean;
};

export async function listarColaboradores(filtro: FiltroColaboradores = {}) {
  const empresaId = await empresaAtualId();
  return prisma.colaborador.findMany({
    where: {
      empresaId,
      ativo: filtro.incluirInativos ? undefined : true,
      OR: filtro.busca
        ? [
            { nome: { contains: filtro.busca, mode: "insensitive" } },
            { matricula: { contains: filtro.busca, mode: "insensitive" } },
            { setor: { contains: filtro.busca, mode: "insensitive" } },
          ]
        : undefined,
    },
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
        include: { material: true },
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

// ---------- calendário ----------

/**
 * Empréstimos que tocam o intervalo [inicio, fim]: retirados até o fim do intervalo
 * E que ainda estavam com alguém em algum momento dele (abertos, ou com prazo/devolução
 * depois do início).
 */
export async function emprestimosNoIntervalo(inicio: Date, fim: Date) {
  const empresaId = await empresaAtualId();
  return prisma.emprestimo.findMany({
    where: {
      empresaId,
      retiradoEm: { lte: fim },
      OR: [
        { status: { not: "DEVOLVIDO" } },
        { previsaoDevolucao: { gte: inicio } },
        { itens: { some: { devolvidoEm: { gte: inicio } } } },
      ],
    },
    include: {
      colaborador: { select: { id: true, nome: true } },
      itens: {
        select: {
          quantidade: true,
          devolvidoEm: true,
          material: { select: { nome: true } },
        },
      },
    },
    orderBy: { retiradoEm: "asc" },
  });
}

export type EmprestimoDoCalendario = Awaited<
  ReturnType<typeof emprestimosNoIntervalo>
>[number];

// ---------- painel ----------

/**
 * Os materiais que mais saíram (somando as quantidades de todas as retiradas).
 * groupBy + orderBy pela SOMA + take = "TOP 5" do SQL.
 */
export async function materiaisMaisEmprestados(limite = 5) {
  const empresaId = await empresaAtualId();
  const grupos = await prisma.itemEmprestimo.groupBy({
    by: ["materialId"],
    where: { emprestimo: { empresaId } },
    _sum: { quantidade: true },
    _count: { emprestimoId: true },
    orderBy: { _sum: { quantidade: "desc" } },
    take: limite,
  });
  if (grupos.length === 0) return [];

  // O groupBy só devolve o id: buscamos os nomes numa segunda consulta (uma só, com IN).
  const materiais = await prisma.material.findMany({
    where: { id: { in: grupos.map((g) => g.materialId) } },
    select: { id: true, nome: true },
  });
  const nomePorId = new Map(materiais.map((m) => [m.id, m.nome]));

  return grupos.map((grupo) => ({
    id: grupo.materialId,
    nome: nomePorId.get(grupo.materialId) ?? "—",
    unidades: grupo._sum.quantidade ?? 0,
    retiradas: grupo._count.emprestimoId,
  }));
}

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
