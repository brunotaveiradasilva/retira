import "server-only";
import { RegraDeNegocioError, violouUnico } from "./erros";

/** O código tem 4 dígitos: vai de 0001 a 9999. */
export const MAIOR_CODIGO = 9999;

/**
 * Cria um registro com o próximo código livre da empresa (o maior + 1).
 *
 * Por que tentar de novo? Se duas pessoas cadastram ao mesmo tempo, as duas leem o
 * mesmo "maior" e tentam gravar o mesmo número. O @@unique([empresaId, numero]) do
 * banco recusa a segunda (erro P2002): ela lê o maior de novo e tenta com o seguinte.
 */
export async function criarComProximoCodigo<T>(opcoes: {
  maiorAtual: () => Promise<number | null>;
  criar: (numero: number) => Promise<T>;
  /** "materiais", "colaboradores": vai na mensagem de limite. */
  oQue: string;
}): Promise<T> {
  for (let tentativa = 1; ; tentativa++) {
    const numero = ((await opcoes.maiorAtual()) ?? 0) + 1;
    if (numero > MAIOR_CODIGO) {
      throw new RegraDeNegocioError(
        `A empresa chegou ao limite de ${MAIOR_CODIGO} ${opcoes.oQue}.`,
      );
    }
    try {
      return await opcoes.criar(numero);
    } catch (erro) {
      if (violouUnico(erro) && tentativa < 3) continue;
      throw erro;
    }
  }
}
