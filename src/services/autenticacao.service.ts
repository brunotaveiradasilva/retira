import "server-only";
import { prisma } from "@/lib/prisma";
import { conferirSenha, gerarHashDeSenha } from "@/lib/senha";
import type { CadastroInput, LoginInput } from "@/schemas/autenticacao";
import { RegraDeNegocioError, violouUnico } from "./erros";

/**
 * Cria a empresa e o primeiro usuário (admin) de uma vez.
 * $transaction: ou as duas coisas são gravadas, ou nenhuma. Nunca fica
 * uma empresa sem dono nem um usuário sem empresa.
 */
export async function cadastrarEmpresa(dados: CadastroInput) {
  // Conferimos antes pra dar a mensagem certa no campo certo.
  if (await prisma.usuario.findUnique({ where: { email: dados.email } })) {
    throw new RegraDeNegocioError(
      "Esse e-mail já tem cadastro. Tente entrar.",
      "email",
    );
  }
  if (
    dados.cnpj &&
    (await prisma.empresa.findUnique({ where: { cnpj: dados.cnpj } }))
  ) {
    throw new RegraDeNegocioError(
      "Já existe uma empresa com esse CNPJ.",
      "cnpj",
    );
  }

  const senhaHash = await gerarHashDeSenha(dados.senha);

  try {
    return await prisma.$transaction(async (tx) => {
      const empresa = await tx.empresa.create({
        data: { nome: dados.empresaNome, cnpj: dados.cnpj },
      });
      return tx.usuario.create({
        data: {
          nome: dados.nome,
          email: dados.email,
          senhaHash,
          papel: "ADMIN",
          empresaId: empresa.id,
        },
      });
    });
  } catch (erro) {
    // Raro: duas pessoas cadastrando o mesmo e-mail/CNPJ no mesmo instante,
    // entre a conferência lá de cima e a gravação. O @unique do banco segura.
    if (violouUnico(erro)) {
      throw new RegraDeNegocioError(
        "E-mail ou CNPJ já cadastrado. Confira os dados.",
      );
    }
    throw erro;
  }
}

/** Devolve o usuário se e-mail e senha conferem; senão, lança erro. */
export async function autenticar(dados: LoginInput) {
  const usuario = await prisma.usuario.findUnique({
    where: { email: dados.email },
  });

  // Mesma mensagem pros dois casos (e-mail não existe / senha errada):
  // assim ninguém descobre quais e-mails têm cadastro tentando logar.
  const senhaOk = usuario
    ? await conferirSenha(dados.senha, usuario.senhaHash)
    : false;
  if (!usuario || !senhaOk) {
    throw new RegraDeNegocioError("E-mail ou senha incorretos.");
  }
  return usuario;
}
