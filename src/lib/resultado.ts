// O que toda Server Action devolve pra tela.
//
// É um "discriminated union": o campo `ok` decide o formato do resto.
//   if (resultado.ok) { resultado.id }       ← o TypeScript sabe que existe
//   else { resultado.erro }                   ← e aqui também
export type Resultado =
  | { ok: true; id?: string; mensagem?: string }
  | {
      ok: false;
      erro: string;
      /** Erros por campo, ex.: { nome: ["Informe o nome"] } */
      campos?: Record<string, string[] | undefined>;
      /**
       * O que a pessoa digitou. O React 19 limpa o <form action> depois de cada envio;
       * devolvendo os valores, o formulário consegue mostrá-los de novo quando dá erro.
       */
      valores?: Record<string, string>;
    };

/** Só o lado de erro do Resultado. Extract pega do union o membro que tem ok: false. */
export type Falha = Extract<Resultado, { ok: false }>;
