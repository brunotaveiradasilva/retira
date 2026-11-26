"use client";
// ↑ Este componente precisa saber a URL atual (usePathname), e hooks só rodam no navegador.
// Por isso ele é um Client Component. O resto da barra lateral continua no servidor.

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Package,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ItemDeMenu = {
  href: string;
  rotulo: string;
  icone: LucideIcon; // o tipo de um componente de ícone do lucide
};

const itens: ItemDeMenu[] = [
  { href: "/painel", rotulo: "Painel", icone: LayoutDashboard },
  { href: "/materiais", rotulo: "Materiais", icone: Package },
  { href: "/tipos", rotulo: "Tipos", icone: Tags },
  { href: "/colaboradores", rotulo: "Colaboradores", icone: Users },
  { href: "/emprestimos", rotulo: "Empréstimos", icone: ArrowLeftRight },
];

type NavLinksProps = {
  /** "vertical" na barra lateral (computador), "horizontal" na barra do topo (celular). */
  direcao?: "vertical" | "horizontal";
};

// O menu exportado. Em rotas como /materiais/[id] o endereço só é conhecido quando alguém
// acessa, então o Next pede um <Suspense> em volta de quem lê a URL (usePathname).
// Enquanto isso, o fallback desenha o mesmo menu sem nenhum item aceso.
export function NavLinks({ direcao = "vertical" }: NavLinksProps) {
  return (
    <Suspense fallback={<Menu direcao={direcao} pathname={null} />}>
      <MenuComRotaAtual direcao={direcao} />
    </Suspense>
  );
}

function MenuComRotaAtual({ direcao = "vertical" }: NavLinksProps) {
  const pathname = usePathname();
  return <Menu direcao={direcao} pathname={pathname} />;
}

// Só desenha: recebe a rota atual (ou null) por prop.
function Menu({
  direcao = "vertical",
  pathname,
}: NavLinksProps & { pathname: string | null }) {
  return (
    <nav
      className={cn(
        "flex gap-1",
        direcao === "vertical" ? "flex-col" : "overflow-x-auto",
      )}
    >
      {itens.map((item) => {
        // Ativo na própria página e nas de dentro: /materiais/m1 acende "Materiais".
        const ativo =
          pathname !== null &&
          (pathname === item.href || pathname.startsWith(item.href + "/"));
        // Componente guardado numa variável precisa começar com letra maiúscula pra virar <Icone />.
        const Icone = item.icone;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              ativo
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icone className="size-4" aria-hidden="true" />
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
