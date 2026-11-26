import { z } from "./zod";

// Um schema Zod descreve como o dado TEM que ser. `parse` confere e devolve o dado limpo
// (com trim, conversões...) ou lista o que está errado.
export const tipoSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Mínimo de 2 letras")
    .max(60, "Máximo de 60 letras"),
});

// O tipo TypeScript sai do schema: escreve uma vez, usa nos dois.
export type TipoInput = z.infer<typeof tipoSchema>;
