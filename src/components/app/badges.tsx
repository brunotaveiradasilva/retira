import { Badge } from "@/components/ui/badge";
import { nomeDoEstado, nomeDoStatus } from "@/lib/formatar";
import type { EstadoMaterial, StatusEmprestimo } from "@/types";

// Cada estado ganha uma variante do Badge. Record obriga a cobrir todos os estados.
const varianteDoEstado: Record<
  EstadoMaterial,
  "secondary" | "outline" | "destructive"
> = {
  BOM: "secondary",
  MANUTENCAO: "outline",
  DANIFICADO: "destructive",
  BAIXADO: "outline",
};

export function EstadoBadge({ estado }: { estado: EstadoMaterial }) {
  return (
    <Badge variant={varianteDoEstado[estado]}>{nomeDoEstado[estado]}</Badge>
  );
}

type StatusBadgeProps = {
  status: StatusEmprestimo;
  /** Dias de atraso (0 = em dia). Vem de diasDeAtraso() em lib/regras.ts. */
  diasAtrasado?: number;
};

export function StatusBadge({ status, diasAtrasado = 0 }: StatusBadgeProps) {
  // "Atrasado" não é um status salvo: é calculado (previsão < hoje e ainda aberto).
  if (diasAtrasado > 0)
    return (
      <Badge variant="destructive">
        Atrasado · {diasAtrasado} {diasAtrasado === 1 ? "dia" : "dias"}
      </Badge>
    );
  if (status === "DEVOLVIDO")
    return <Badge variant="outline">{nomeDoStatus[status]}</Badge>;
  return <Badge>{nomeDoStatus[status]}</Badge>;
}
