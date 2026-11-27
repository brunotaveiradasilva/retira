import { textoOpcional, z } from "./zod";

// Um item da retirada: qual material e quantas unidades.
const itemSchema = z.object({
  materialId: z.string().min(1, "Escolha o material"),
  quantidade: z
    .number({ error: "Informe a quantidade" })
    .int("Use um número inteiro")
    .min(1, "Mínimo 1"),
});

// <input type="date"> devolve "2026-12-03" (ou "" se vazio).
const dataOpcional = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Data inválida")
  .nullish()
  .transform((valor) => valor || null);

export const retiradaSchema = z
  .object({
    colaboradorId: z.string().min(1, "Escolha quem está retirando"),
    retiradoEm: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de retirada"),
    previsaoDevolucao: dataOpcional,
    // Evento (tudo opcional): pra que o material está saindo.
    dataEvento: dataOpcional,
    localEvento: textoOpcional(120),
    enderecoEvento: textoOpcional(200),
    observacao: textoOpcional(300),
    // z.array: uma LISTA de itens. min(1): pelo menos um.
    itens: z.array(itemSchema).min(1, "Adicione pelo menos um item"),
  })
  // O mesmo material duas vezes na lista? Melhor somar numa linha só.
  .refine(
    (dados) =>
      new Set(dados.itens.map((item) => item.materialId)).size ===
      dados.itens.length,
    { path: ["itens"], message: "Há um material repetido na lista" },
  )
  // A ordem das datas: retirada → evento → devolução.
  // Datas no formato AAAA-MM-DD podem ser comparadas como texto ("2026-12-03" < "2026-12-10").
  .superRefine((dados, contexto) => {
    const { retiradoEm, dataEvento, previsaoDevolucao } = dados;
    if (dataEvento && dataEvento < retiradoEm) {
      contexto.addIssue({
        code: "custom",
        path: ["dataEvento"],
        message: "O evento não pode ser antes da retirada",
      });
    }
    if (previsaoDevolucao && previsaoDevolucao < retiradoEm) {
      contexto.addIssue({
        code: "custom",
        path: ["previsaoDevolucao"],
        message: "A devolução não pode ser antes da retirada",
      });
    } else if (
      previsaoDevolucao &&
      dataEvento &&
      previsaoDevolucao < dataEvento
    ) {
      contexto.addIssue({
        code: "custom",
        path: ["previsaoDevolucao"],
        message: "A devolução não pode ser antes do evento",
      });
    }
  });

export type RetiradaForm = z.input<typeof retiradaSchema>;
export type RetiradaInput = z.output<typeof retiradaSchema>;

export const devolucaoSchema = z.object({
  // Ids dos itens que estão voltando agora (pode ser só parte do empréstimo).
  itemIds: z.array(z.string()).min(1, "Marque pelo menos um item"),
  // Itens que voltaram quebrados (só faz sentido para material unitário).
  danificados: z.array(z.string()).default([]),
});

export type DevolucaoInput = z.output<typeof devolucaoSchema>;
