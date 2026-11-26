import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ColaboradorFormulario } from "@/components/colaboradores/colaborador-form";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = { title: "Novo colaborador" };

// Esta página não lê o banco: não precisa ser async nem de loading.tsx.
export default function NovoColaboradorPage() {
  return (
    <>
      <PageHeader
        topo={
          <Link
            href="/colaboradores"
            className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Colaboradores
          </Link>
        }
        titulo="Novo colaborador"
      />
      <ColaboradorFormulario colaboradorId={null} />
    </>
  );
}
