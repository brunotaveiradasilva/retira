import { textoOpcional, z } from "./zod";

const email = z
  .string()
  .trim()
  .toLowerCase() // "Ana@Empresa.com" e "ana@empresa.com" são o mesmo login
  .pipe(z.email("E-mail inválido"));

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, "Informe a senha"),
});

export const cadastroSchema = z
  .object({
    empresaNome: z
      .string()
      .trim()
      .min(2, "Informe o nome da empresa")
      .max(100, "Máximo de 100 letras"),
    cnpj: textoOpcional(18),
    nome: z.string().trim().min(3, "Informe seu nome").max(100),
    email,
    senha: z
      .string()
      .min(8, "Mínimo de 8 caracteres")
      .max(72, "Máximo de 72 caracteres"),
    confirmacao: z.string(),
  })
  .refine((dados) => dados.senha === dados.confirmacao, {
    path: ["confirmacao"],
    message: "As senhas não são iguais",
  });

export type LoginInput = z.output<typeof loginSchema>;
export type CadastroInput = z.output<typeof cadastroSchema>;
