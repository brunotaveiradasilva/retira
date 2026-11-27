// Na fase 1 os tipos eram escritos à mão aqui.
// Agora o Prisma gera tudo a partir do prisma/schema.prisma (`npm run db:generate`):
// mudou o schema → os tipos mudam junto, e o TypeScript aponta o que quebrou.
// Este arquivo só reexporta, pra o resto do código continuar importando de "@/types".

export type {
  Colaborador,
  Emprestimo,
  ItemEmprestimo,
  Material,
} from "@/generated/prisma/client";

export type {
  Controle,
  EstadoMaterial,
  StatusEmprestimo,
} from "@/generated/prisma/enums";
