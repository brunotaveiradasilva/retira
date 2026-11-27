import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MaterialFormulario } from "@/components/materiais/material-form";

export const metadata: Metadata = { title: "Novo material" };

// A pasta "novo" é fixa e tem prioridade sobre [id]: /materiais/novo cai aqui, não no detalhe.
// Sem os "tipos", esta página não lê mais o banco: não precisa ser async nem de loading.tsx.
export default function NovoMaterialPage() {
  return (
    <>
      <PageHeader
        topo={
          <Link
            href="/materiais"
            className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Materiais
          </Link>
        }
        titulo="Novo material"
      />
      <MaterialFormulario materialId={null} />
    </>
  );
}
