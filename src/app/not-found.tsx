import Link from "next/link";
import { LogoIcon } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";

// Aparece quando a URL não existe ou quando uma página chama notFound().
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <LogoIcon size={48} />
      <h1 className="text-2xl font-medium tracking-tight">
        Não encontramos esta página
      </h1>
      <p className="text-muted-foreground max-w-sm">
        O endereço pode estar errado, ou o item foi removido.
      </p>
      <Link href="/painel" className={buttonVariants({ variant: "outline" })}>
        Voltar ao painel
      </Link>
    </main>
  );
}
