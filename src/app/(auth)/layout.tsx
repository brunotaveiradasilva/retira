import Link from "next/link";
import { Logo } from "@/components/logo";

// Outro route group: as telas de entrar/cadastrar dividem esta moldura simples,
// sem a barra lateral do sistema.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="bg-muted/30 flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8">
        <Logo size={36} />
      </Link>
      <div className="bg-background w-full max-w-md rounded-2xl border p-6 shadow-sm sm:p-8">
        {children}
      </div>
    </main>
  );
}
