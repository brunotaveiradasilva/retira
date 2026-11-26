import "server-only";
import { prisma } from "@/lib/prisma";
import type { TipoInput } from "@/schemas/tipo";
import { RegraDeNegocioError, violouUnico } from "./erros";

// SERVICES: as regras de negócio + a gravação no banco.
// - Recebem o empresaId por parâmetro (não sabem nada de sessão, cookies, formulário).
// - Recebem o dado já validado pelo Zod.
// - Lançam RegraDeNegocioError quando uma regra é violada.
// É esta camada que um dia vira a API em Java: mesma assinatura, outra linguagem.

export async function criarTipo(empresaId: string, dados: TipoInput) {
  try {
    return await prisma.tipoMaterial.create({
      data: { nome: dados.nome, empresaId },
    });
  } catch (erro) {
    if (violouUnico(erro)) {
      throw new RegraDeNegocioError("Já existe um tipo com esse nome.", "nome");
    }
    throw erro;
  }
}

export async function renomearTipo(
  empresaId: string,
  id: string,
  dados: TipoInput,
) {
  await garantirTipoDaEmpresa(empresaId, id);
  try {
    return await prisma.tipoMaterial.update({
      where: { id },
      data: { nome: dados.nome },
    });
  } catch (erro) {
    if (violouUnico(erro)) {
      throw new RegraDeNegocioError("Já existe um tipo com esse nome.", "nome");
    }
    throw erro;
  }
}

export async function excluirTipo(empresaId: string, id: string) {
  const tipo = await garantirTipoDaEmpresa(empresaId, id);
  const emUso = await prisma.material.count({ where: { tipoId: id } });
  if (emUso > 0) {
    throw new RegraDeNegocioError(
      `"${tipo.nome}" tem ${emUso} ${emUso === 1 ? "material" : "materiais"}. Mude o tipo deles antes de excluir.`,
    );
  }
  await prisma.tipoMaterial.delete({ where: { id } });
}

// Segurança multi-empresa: antes de alterar, confirma que o registro é DESTA empresa.
// Sem isso, alguém poderia mandar o id de um tipo de outra empresa direto pra action.
async function garantirTipoDaEmpresa(empresaId: string, id: string) {
  const tipo = await prisma.tipoMaterial.findFirst({
    where: { id, empresaId },
  });
  if (!tipo) throw new RegraDeNegocioError("Tipo não encontrado.");
  return tipo;
}
