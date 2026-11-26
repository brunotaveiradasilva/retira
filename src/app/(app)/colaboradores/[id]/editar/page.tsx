import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ColaboradorFormulario } from "@/components/colaboradores/colaborador-form";
import { PageHeader } from "@/components/app/page-header";
import { buscarColaborador } from "@/lib/consultas";

export async function generateMetadata({
  params,
}: PageProps<"/colaboradores/[id]/editar">) {
  const { id } = await params;
  const colaborador = await buscarColaborador(id);
  return {
    title: colaborador ? `Editar ${colaborador.nome}` : "Editar colaborador",
  };
}

export default async function EditarColaboradorPage({
  params,
}: PageProps<"/colaboradores/[id]/editar">) {
  const { id } = await params;
  const colaborador = await buscarColaborador(id);
  if (!colaborador) notFound();

  return (
    <>
      <PageHeader
        topo={
          <Link
            href={`/colaboradores/${colaborador.id}`}
            className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />{" "}
            {colaborador.nome}
          </Link>
        }
        titulo="Editar colaborador"
      />
      <ColaboradorFormulario
        colaboradorId={colaborador.id}
        // null do banco → "" no formulário
        valoresIniciais={{
          nome: colaborador.nome,
          matricula: colaborador.matricula ?? "",
          setor: colaborador.setor ?? "",
          telefone: colaborador.telefone ?? "",
        }}
      />
    </>
  );
}
