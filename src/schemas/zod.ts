import { z } from "zod";

// Mensagens padrão do Zod em português ("Entrada inválida: esperado string...").
// Os schemas importam o `z` daqui, então a configuração vale pra todos.
z.config(z.locales.pt());

export { z };

/**
 * Texto opcional: vazio vira null no banco.
 *
 * Aceita string OU null na entrada porque o schema roda DUAS vezes:
 * no navegador (React Hook Form) e de novo no servidor (Server Action).
 * A saída da 1ª (null) vira a entrada da 2ª — então precisa aceitar os dois.
 */
export function textoOpcional(max: number) {
  return z
    .string()
    .trim()
    .max(max, `Máximo de ${max} caracteres`)
    .nullish()
    .transform((valor) => valor || null);
}
