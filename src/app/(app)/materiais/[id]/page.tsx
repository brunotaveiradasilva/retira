import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EstadoBadge } from "@/components/app/badges";
import { ListaEmprestimos } from "@/components/app/lista-emprestimos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buscarMaterial,
  buscarTipo,
  emprestimosDoMaterial,
  estaAberto,
  listarMateriais,
  quantidadeDisponivel,
  quantidadeEmprestada,
} from "@/lib/consultas";

// A pasta [id] é uma ROTA DINÂMICA: /materiais/m1, /materiais/m2... caem todas aqui.

// Diz ao Next quais ids existem, pra ele gerar essas páginas já no build.
// (Com Cache Components ligado, sem isso teríamos que usar <Suspense> ao ler params.)
export function generateStaticParams() {
  return listarMateriais().map((material) => ({ id: material.id }));
}

// O título da aba muda conforme o material.
export async function generateMetadata({
  params,
}: PageProps<"/materiais/[id]">) {
  const { id } = await params;
  return { title: buscarMaterial(id)?.nome ?? "Material" };
}

// No Next 15+ o params é uma Promise: por isso a página é async e usamos await.
export default async function MaterialPage({
  params,
}: PageProps<"/materiais/[id]">) {
  const { id } = await params;
  const material = buscarMaterial(id);

  // id que não existe (ex.: /materiais/xyz) → página 404.
  // Depois deste if, o TypeScript sabe que `material` não é undefined.
  if (!material) notFound();

  const historico = emprestimosDoMaterial(material.id);
  const abertos = historico.filter(estaAberto);

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
        titulo={material.nome}
        descricao={[material.codigo, buscarTipo(material.tipoId)?.nome]
          .filter(Boolean)
          .join(" · ")}
        acoes={<EstadoBadge estado={material.estado} />}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Info rotulo="Total" valor={material.quantidade} />
        <Info rotulo="Emprestado" valor={quantidadeEmprestada(material.id)} />
        <Info rotulo="Disponível" valor={quantidadeDisponivel(material)} />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-medium">Com quem está agora</h2>
        <ListaEmprestimos
          emprestimos={abertos}
          vazio="Ninguém está com este material agora."
        />
      </section>

      <section>
        <h2 className="mb-3 font-medium">Histórico</h2>
        <ListaEmprestimos
          emprestimos={historico}
          vazio="Este material nunca foi emprestado."
        />
      </section>
    </>
  );
}

// Componente pequeno usado só nesta página: pode ficar no mesmo arquivo.
function Info({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-normal">
          {rotulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-medium tabular-nums">
        {valor}
      </CardContent>
    </Card>
  );
}
