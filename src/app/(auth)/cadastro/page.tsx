import Link from "next/link";
import type { Metadata } from "next";
import { CadastroForm } from "@/components/autenticacao/cadastro-form";

export const metadata: Metadata = { title: "Cadastrar empresa" };

export default function CadastroPage() {
  return (
    <>
      <h1 className="text-xl font-medium tracking-tight">
        Cadastre sua empresa
      </h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">
        Em um minuto você começa a organizar o almoxarifado.
      </p>

      <CadastroForm />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
