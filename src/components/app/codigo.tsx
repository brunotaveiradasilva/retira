import { formatarCodigo } from "@/lib/formatar";
import { cn } from "@/lib/utils";

/** O código de 4 dígitos de um material ou colaborador: "0007", em fonte de largura fixa. */
export function Codigo({
  numero,
  className,
}: {
  numero: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-muted-foreground font-mono text-xs tabular-nums",
        className,
      )}
    >
      {formatarCodigo(numero)}
    </span>
  );
}
