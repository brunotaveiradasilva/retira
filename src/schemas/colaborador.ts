import { textoOpcional, z } from "./zod";

export const colaboradorSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo")
    .max(100, "Máximo de 100 letras"),
  matricula: textoOpcional(20),
  setor: textoOpcional(60),
  telefone: textoOpcional(20).refine(
    // Se preencheu, precisa ter pelo menos 10 dígitos (DDD + número).
    (valor) => !valor || valor.replace(/\D/g, "").length >= 10,
    "Telefone com DDD, ex.: (51) 99999-9999",
  ),
});

export type ColaboradorForm = z.input<typeof colaboradorSchema>;
export type ColaboradorInput = z.output<typeof colaboradorSchema>;
