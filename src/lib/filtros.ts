// Ler a URL com segurança.
//
// `searchParams` chega como { [chave]: string | string[] | undefined }:
//   /materiais?busca=fur           → { busca: "fur" }
//   /materiais?tipo=a&tipo=b       → { tipo: ["a", "b"] }   (a mesma chave duas vezes)
//   /materiais                     → { }
// Qualquer pessoa pode digitar qualquer coisa na URL, então NADA aqui é confiável:
// estas funções convertem e, se o valor não fizer sentido, devolvem o padrão.

type Valor = string | string[] | undefined;

/** Texto limpo, ou undefined se vazio. */
export function lerTexto(valor: Valor): string | undefined {
  const texto = (Array.isArray(valor) ? valor[0] : valor)?.trim();
  return texto ? texto.slice(0, 100) : undefined;
}

/** Número inteiro ≥ 1 (pra página), ou o padrão. */
export function lerPagina(valor: Valor): number {
  const numero = Number(lerTexto(valor));
  return Number.isInteger(numero) && numero >= 1 ? numero : 1;
}

/**
 * Um valor de uma lista fechada, ou o padrão (ou undefined, se não houver padrão).
 * <const T extends string>: função GENÉRICA. O TypeScript descobre T pela lista
 * que você passa, e o retorno já sai com o tipo certo (ex.: "abertos" | "todos").
 *
 * As duas primeiras linhas são OVERLOADS: duas "assinaturas" pra mesma função.
 *   lerOpcao(v, lista)          → T | undefined
 *   lerOpcao(v, lista, padrao)  → T
 */
export function lerOpcao<const T extends string>(
  valor: Valor,
  opcoes: readonly T[],
): T | undefined;
export function lerOpcao<const T extends string>(
  valor: Valor,
  opcoes: readonly T[],
  padrao: T,
): T;
export function lerOpcao<const T extends string>(
  valor: Valor,
  opcoes: readonly T[],
  padrao?: T,
): T | undefined {
  const texto = lerTexto(valor);
  return opcoes.find((opcao) => opcao === texto) ?? padrao;
}

/** Monta uma URL trocando alguns parâmetros e mantendo os outros. */
export function urlCom(
  caminho: string,
  atuais: Record<string, Valor>,
  mudancas: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(atuais)) {
    const texto = lerTexto(valor);
    if (texto) params.set(chave, texto);
  }
  for (const [chave, valor] of Object.entries(mudancas)) {
    if (valor === undefined || valor === "") params.delete(chave);
    else params.set(chave, String(valor));
  }
  const busca = params.toString();
  return busca ? `${caminho}?${busca}` : caminho;
}
