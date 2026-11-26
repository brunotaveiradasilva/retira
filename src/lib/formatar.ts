import type { EstadoMaterial, StatusEmprestimo } from "@/types";

const formatoData = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// Campo opcional no banco chega como null (não undefined). Aceitamos os dois.
export function formatarData(data: Date | null | undefined): string {
  return data ? formatoData.format(data) : "—";
}

// Record<Chave, Valor>: um objeto que TEM que ter todas as chaves do union type.
// Se um dia surgir um estado novo, o TypeScript reclama aqui até você colocar o texto dele.
export const nomeDoEstado: Record<EstadoMaterial, string> = {
  BOM: "Bom",
  DANIFICADO: "Danificado",
  MANUTENCAO: "Em manutenção",
  BAIXADO: "Baixado",
};

export const nomeDoStatus: Record<StatusEmprestimo, string> = {
  ABERTO: "Aberto",
  PARCIAL: "Parcial",
  DEVOLVIDO: "Devolvido",
};

/** "Ana Souza" → "AS" */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima =
    partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}
