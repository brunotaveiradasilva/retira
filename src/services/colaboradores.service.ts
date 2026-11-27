import "server-only";
import { prisma } from "@/lib/prisma";
import type { ColaboradorInput } from "@/schemas/colaborador";
import { RegraDeNegocioError } from "./erros";
import { criarComProximoCodigo } from "./numeracao";

export async function criarColaborador(
  empresaId: string,
  dados: ColaboradorInput,
) {
  return criarComProximoCodigo({
    maiorAtual: async () =>
      (
        await prisma.colaborador.aggregate({
          where: { empresaId },
          _max: { numero: true },
        })
      )._max.numero,
    criar: (numero) =>
      prisma.colaborador.create({ data: { ...dados, empresaId, numero } }),
    oQue: "colaboradores",
  });
}

export async function atualizarColaborador(
  empresaId: string,
  id: string,
  dados: ColaboradorInput,
) {
  await garantirColaboradorDaEmpresa(empresaId, id);
  return prisma.colaborador.update({ where: { id }, data: dados });
}

/**
 * Ativa ou desativa. Desativar é permitido mesmo com material em mãos,
 * mas devolvemos um aviso pra quem está usando o sistema cobrar a devolução.
 */
export async function alterarAtivo(
  empresaId: string,
  id: string,
  ativo: boolean,
): Promise<{ aviso?: string }> {
  await garantirColaboradorDaEmpresa(empresaId, id);
  await prisma.colaborador.update({ where: { id }, data: { ativo } });

  if (!ativo) {
    const abertos = await prisma.emprestimo.count({
      where: { colaboradorId: id, status: { not: "DEVOLVIDO" } },
    });
    if (abertos > 0) {
      return {
        aviso: `Desativado, mas ainda tem ${abertos} empréstimo(s) em aberto. Lembre de cobrar a devolução.`,
      };
    }
  }
  return {};
}

export async function excluirColaborador(empresaId: string, id: string) {
  await garantirColaboradorDaEmpresa(empresaId, id);

  // Regra: quem já retirou material faz parte do histórico. Não apaga: desativa.
  const emprestimos = await prisma.emprestimo.count({
    where: { colaboradorId: id },
  });
  if (emprestimos > 0) {
    throw new RegraDeNegocioError(
      "Este colaborador tem empréstimos no histórico. Em vez de excluir, desative.",
    );
  }
  await prisma.colaborador.delete({ where: { id } });
}

async function garantirColaboradorDaEmpresa(empresaId: string, id: string) {
  const colaborador = await prisma.colaborador.findFirst({
    where: { id, empresaId },
  });
  if (!colaborador)
    throw new RegraDeNegocioError("Colaborador não encontrado.");
  return colaborador;
}
