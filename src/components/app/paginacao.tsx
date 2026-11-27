import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { urlCom } from "@/lib/filtros";
import { cn } from "@/lib/utils";

type PaginacaoProps = {
  caminho: string;
  /** Os searchParams atuais (pra manter busca e filtros ao trocar de página). */
  parametros: Record<string, string | string[] | undefined>;
  pagina: number;
  totalDePaginas: number;
};

// Server Component: só links. Não precisa de JavaScript no navegador pra funcionar.
export function Paginacao({
  caminho,
  parametros,
  pagina,
  totalDePaginas,
}: PaginacaoProps) {
  if (totalDePaginas <= 1) return null;

  const link = (numero: number) =>
    urlCom(caminho, parametros, { pagina: numero === 1 ? undefined : numero });

  const temAnterior = pagina > 1;
  const temProxima = pagina < totalDePaginas;
  const classe = buttonVariants({ variant: "outline", size: "sm" });

  return (
    <nav
      aria-label="Paginação"
      className="mt-4 flex items-center justify-between gap-2 text-sm"
    >
      {temAnterior ? (
        <Link href={link(pagina - 1)} className={classe} scroll={false}>
          <ChevronLeft aria-hidden="true" /> Anterior
        </Link>
      ) : (
        <span className={cn(classe, "pointer-events-none opacity-50")}>
          <ChevronLeft aria-hidden="true" /> Anterior
        </span>
      )}
      <span className="text-muted-foreground">
        Página {pagina} de {totalDePaginas}
      </span>
      {temProxima ? (
        <Link href={link(pagina + 1)} className={classe} scroll={false}>
          Próxima <ChevronRight aria-hidden="true" />
        </Link>
      ) : (
        <span className={cn(classe, "pointer-events-none opacity-50")}>
          Próxima <ChevronRight aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
