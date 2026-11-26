import { LogOut } from "lucide-react";
import { sairAction } from "@/actions/autenticacao";
import { AvatarIniciais } from "@/components/app/avatar-iniciais";
import { Button } from "@/components/ui/button";
import { usuarioLogado } from "@/lib/empresa-atual";

// Server Component assíncrono: lê a sessão (cookie + banco).
// Por isso o layout o coloca dentro de um <Suspense>: a barra lateral aparece na hora
// e só este pedacinho espera.
export async function UsuarioMenu() {
  const usuario = await usuarioLogado();

  return (
    <div className="flex items-center gap-2">
      <AvatarIniciais nome={usuario.nome} className="size-8 text-xs" />
      <div className="min-w-0 flex-1 leading-tight">
        <div className="truncate text-sm font-medium">{usuario.nome}</div>
        <div className="text-muted-foreground truncate text-xs">
          {usuario.empresa.nome}
        </div>
      </div>
      {/* Formulário com Server Action direto: funciona até sem JavaScript. */}
      <form action={sairAction}>
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label="Sair"
          title="Sair"
        >
          <LogOut />
        </Button>
      </form>
    </div>
  );
}

export function UsuarioMenuCarregando() {
  return (
    <div className="flex animate-pulse items-center gap-2">
      <div className="bg-muted size-8 rounded-full" />
      <div className="flex-1 space-y-1">
        <div className="bg-muted h-3 w-24 rounded" />
        <div className="bg-muted h-3 w-16 rounded" />
      </div>
    </div>
  );
}
