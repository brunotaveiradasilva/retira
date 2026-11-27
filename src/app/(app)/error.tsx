"use client"; // Error boundaries precisam ser Client Components

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

// error.tsx: se QUALQUER página dentro de (app) lançar um erro inesperado
// (banco fora do ar, bug), o Next mostra isto NO LUGAR da página — o menu continua.
// Sem ele, a pessoa veria uma tela branca ou a página de erro genérica do Next.
//
// No Next 16 o componente recebe:
//   error → o que foi lançado. Tipo `unknown`: pode não ser um Error, então checamos.
//   retry → busca de novo e redesenha a página (se o problema passou, volta ao normal).
export default function ErroDaPagina({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    // Aqui entraria um serviço de monitoramento (Sentry etc.). Por enquanto, o console.
    console.error(error);
  }, [error]);

  // Erros vindos do servidor chegam com a mensagem escondida (pra não vazar detalhes)
  // e um `digest`: um código que bate com o log do servidor.
  const digest =
    error instanceof Error && "digest" in error
      ? String((error as Error & { digest?: string }).digest)
      : null;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <div className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <AlertTriangle aria-hidden="true" />
      </div>
      <h1 className="text-xl font-medium tracking-tight">
        Algo deu errado nesta página
      </h1>
      <p className="text-muted-foreground text-sm">
        Não foi culpa sua. Tente de novo; se continuar, avise o suporte
        {digest && (
          <>
            {" "}
            informando o código{" "}
            <code className="text-foreground">{digest}</code>
          </>
        )}
        .
      </p>
      <div className="flex gap-2">
        <Button onClick={() => retry()}>
          <RotateCw aria-hidden="true" /> Tentar de novo
        </Button>
        <Link href="/painel" className={buttonVariants({ variant: "outline" })}>
          Ir para o painel
        </Link>
      </div>
    </div>
  );
}
