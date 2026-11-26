import { cn } from "@/lib/utils";

// Tipo das props: o TypeScript avisa se alguém passar algo errado (ex.: size="grande").
type LogoIconProps = {
  /** Tamanho em pixels (largura = altura). */
  size?: number;
  className?: string;
};

/** Só o ícone: "r" minúsculo com a seta saindo, dentro do quadrado verde. */
export function LogoIcon({ size = 32, className }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("shrink-0", className)}
    >
      <rect width="96" height="96" rx="24" className="fill-primary" />
      <g
        fill="none"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary-foreground"
      >
        <path d="M34 76 V28" />
        <path d="M34 48 C34 34 44 26 58 26 H68" />
        <path d="M60 18 L68 26 L60 34" />
      </g>
    </svg>
  );
}

// Reaproveita as props do ícone e acrescenta uma opção a mais.
type LogoProps = LogoIconProps & {
  /** Esconde o nome e mostra só o ícone. */
  iconOnly?: boolean;
};

/** Ícone + nome "retira". */
export function Logo({ size = 32, className, iconOnly = false }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoIcon size={size} />
      {!iconOnly && (
        <span
          className="font-medium tracking-tight"
          style={{ fontSize: size * 0.75 }}
        >
          retira
        </span>
      )}
      <span className="sr-only">Retira</span>
    </span>
  );
}
