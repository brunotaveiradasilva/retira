import "server-only";
import { prisma } from "@/lib/prisma";
import type { MaterialInput } from "@/schemas/material";
import { RegraDeNegocioError, violouUnico } from "./erros";

export async function criarMaterial(empresaId: string, dados: MaterialInput) {
  await garantirTipoDaEmpresa(empresaId, dados.tipoId);
  try {
    return await prisma.material.create({ data: { ...dados, empresaId } });
  } catch (erro) {
    throw traduzirErro(erro);
  }
}

export async function atualizarMaterial(
  empresaId: string,
  id: string,
  dados: MaterialInput,
) {
  await garantirMaterialDaEmpresa(empresaId, id);
  await garantirTipoDaEmpresa(empresaId, dados.tipoId);

  // Regra: não dá pra baixar a quantidade abaixo do que está emprestado agora.
  const emprestado = await unidadesForaAgora(id);
  if (dados.quantidade < emprestado) {
    throw new RegraDeNegocioError(
      `Há ${emprestado} unidade(s) emprestada(s). A quantidade não pode ser menor que isso.`,
      "quantidade",
    );
  }

  try {
    return await prisma.material.update({ where: { id }, data: dados });
  } catch (erro) {
    throw traduzirErro(erro);
  }
}

export async function excluirMaterial(empresaId: string, id: string) {
  await garantirMaterialDaEmpresa(empresaId, id);

  // Regra: material que já foi emprestado faz parte do histórico. Não apaga: dá baixa.
  const usos = await prisma.itemEmprestimo.count({ where: { materialId: id } });
  if (usos > 0) {
    throw new RegraDeNegocioError(
      "Este material já foi emprestado e faz parte do histórico. Em vez de excluir, edite e mude o estado para Baixado.",
    );
  }
  await prisma.material.delete({ where: { id } });
}

// ---------- auxiliares ----------

async function unidadesForaAgora(materialId: string): Promise<number> {
  const soma = await prisma.itemEmprestimo.aggregate({
    where: {
      materialId,
      devolvidoEm: null,
      emprestimo: { status: { not: "DEVOLVIDO" } },
    },
    _sum: { quantidade: true },
  });
  return soma._sum.quantidade ?? 0;
}

async function garantirMaterialDaEmpresa(empresaId: string, id: string) {
  const material = await prisma.material.findFirst({
    where: { id, empresaId },
  });
  if (!material) throw new RegraDeNegocioError("Material não encontrado.");
  return material;
}

async function garantirTipoDaEmpresa(empresaId: string, tipoId: string) {
  const tipo = await prisma.tipoMaterial.findFirst({
    where: { id: tipoId, empresaId },
  });
  if (!tipo) throw new RegraDeNegocioError("Tipo inválido.", "tipoId");
}

function traduzirErro(erro: unknown) {
  if (violouUnico(erro)) {
    return new RegraDeNegocioError(
      "Já existe um material com esse código.",
      "codigo",
    );
  }
  return erro;
}
