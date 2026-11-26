import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MaterialFormulario } from "@/components/materiais/material-form";
import { buttonVariants } from "@/components/ui/button";
import { listarTipos } from "@/lib/consultas";

export const metadata: Metadata = { title: "Novo material" };

// A pasta "novo" é fixa e tem prioridade sobre [id]: /materiais/novo cai aqui, não no detalhe.
export default async function NovoMaterialPage() {
  // O formulário roda no navegador, mas a lista de tipos vem do banco:
  // a página (servidor) busca e entrega pronta por props.
  const tipos = await listarTipos();

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
      {tipos.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Cadastre um tipo de material primeiro.{" "}
          <Link href="/tipos" className={buttonVariants({ variant: "link" })}>
            Ir para Tipos
          </Link>
        </p>
      ) : (
        <MaterialFormulario
          materialId={null}
          tipos={tipos.map(({ id, nome }) => ({ id, nome }))}
        />
      )}
    </>
  );
}
