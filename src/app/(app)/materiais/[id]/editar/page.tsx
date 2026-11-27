import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { MaterialFormulario } from "@/components/materiais/material-form";
import { buscarMaterial } from "@/lib/consultas";

export async function generateMetadata({
  params,
}: PageProps<"/materiais/[id]/editar">) {
  const { id } = await params;
  const material = await buscarMaterial(id);
  return { title: material ? `Editar ${material.nome}` : "Editar material" };
}

export default async function EditarMaterialPage({
  params,
}: PageProps<"/materiais/[id]/editar">) {
  const { id } = await params;
  const material = await buscarMaterial(id);
  if (!material) notFound();

  return (
    <>
      <PageHeader
        topo={
          <Link
            href={`/materiais/${material.id}`}
            className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> {material.nome}
          </Link>
        }
        titulo="Editar material"
      />
      <MaterialFormulario
        materialId={material.id}
        // O banco guarda null; o formulário trabalha com texto ("").
        valoresIniciais={{
          nome: material.nome,
          codigo: material.codigo ?? "",
          controle: material.controle,
          quantidade: material.quantidade,
          estado: material.estado,
        }}
      />
    </>
  );
}
