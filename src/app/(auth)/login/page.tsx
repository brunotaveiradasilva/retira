import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/autenticacao/login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-xl font-medium tracking-tight">Entrar</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        Acesse o almoxarifado da sua empresa.
      </p>

      {/* O formulário lê ?de= da URL (useSearchParams): isso só existe na hora do
          acesso, então o Next pede um Suspense em volta. */}
      <Suspense>
        <LoginForm />
      </Suspense>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-primary hover:underline">
          Cadastre sua empresa
        </Link>
      </p>

      {/* Só em desenvolvimento: lembra o login criado pelo seed. */}
      {process.env.NODE_ENV !== "production" && (
        <p className="bg-muted text-muted-foreground mt-6 rounded-lg px-3 py-2 text-xs">
          Dados de exemplo (<code>npm run db:seed</code>):{" "}
          <strong>admin@exemplo.com</strong> / <strong>retira123</strong>
        </p>
      )}
    </>
  );
}
