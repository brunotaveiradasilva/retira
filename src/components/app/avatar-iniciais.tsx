import { iniciais } from "@/lib/formatar";
import { cn } from "@/lib/utils";

type AvatarIniciaisProps = {
  nome: string;
  className?: string;
};

export function AvatarIniciais({ nome, className }: AvatarIniciaisProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-medium",
        className,
      )}
    >
      {iniciais(nome)}
    </span>
  );
}
