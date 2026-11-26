import { textoOpcional, z } from "./zod";
import { Controle, EstadoMaterial } from "@/generated/prisma/enums";

// Este schema roda nos DOIS lados:
//   - no navegador, pelo React Hook Form (erro aparece na hora, sem ir ao servidor)
//   - no servidor, na Server Action (nunca confie no que vem do navegador)
export const materialSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(2, "Informe o nome")
      .max(100, "Máximo de 100 letras"),
    // Campo vazio no formulário vira null no banco.
    codigo: textoOpcional(30),
    tipoId: z.string().min(1, "Escolha o tipo"),
    // z.enum aceita o objeto de enum que o Prisma gerou: se o schema.prisma mudar, isto acompanha.
    controle: z.enum(Controle),
    quantidade: z
      .number({ error: "Informe um número" })
      .int("Use um número inteiro")
      .min(1, "Mínimo 1")
      .max(100_000, "Quantidade alta demais"),
    estado: z.enum(EstadoMaterial),
  })
  // refine: regra que envolve MAIS DE UM campo.
  .refine(
    (dados) => dados.controle === "QUANTIDADE" || dados.quantidade === 1,
    {
      path: ["quantidade"],
      message: "Material unitário tem sempre quantidade 1",
    },
  );

// z.input = o que o formulário preenche (codigo é string)
// z.output = o que sai depois da validação (codigo é string | null)
export type MaterialForm = z.input<typeof materialSchema>;
export type MaterialInput = z.output<typeof materialSchema>;
