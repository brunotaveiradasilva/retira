import Link from "next/link";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/app/nav-links";

// A pasta "(app)" entre parênteses é um ROUTE GROUP: agrupa as páginas do sistema
// pra elas dividirem este layout, mas NÃO entra na URL. /painel, não /app/painel.
// A página inicial (src/app/page.tsx) fica fora do grupo, então não tem barra lateral.

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-1 flex-col md:flex-row">
      {/* Computador: barra lateral fixa à esquerda */}
      <aside className="bg-muted/30 hidden w-60 shrink-0 flex-col gap-6 border-r p-4 md:flex">
        <Link href="/" className="px-2 py-1">
          <Logo size={28} />
        </Link>
        <NavLinks />
        <div className="text-muted-foreground mt-auto px-3 text-xs">
          Construtora Exemplo
          <br />
          dados de demonstração
        </div>
      </aside>

      {/* Celular: logo + menu rolável no topo */}
      <header className="bg-background sticky top-0 z-10 flex flex-col gap-2 border-b px-4 pt-3 pb-2 md:hidden">
        <Link href="/">
          <Logo size={24} />
        </Link>
        <NavLinks direcao="horizontal" />
      </header>

      {/* children = a página da rota atual (painel, materiais...) */}
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
