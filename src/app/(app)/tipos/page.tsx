import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { NovoTipoForm } from "@/components/tipos/novo-tipo-form";
import { TipoLinha } from "@/components/tipos/tipo-linha";
import { listarTipos } from "@/lib/consultas";

export const metadata: Metadata = { title: "Tipos de material" };

// A página é Server Component (lê o banco). Os pedaços interativos (formulário,
// renomear, excluir) são Client Components importados aqui dentro.
export default async function TiposPage() {
  const tipos = await listarTipos();

  return (
    <>
      <PageHeader
        titulo="Tipos de material"
        descricao="Como você agrupa os materiais do almoxarifado"
      />

      <div className="mb-6">
        <NovoTipoForm />
      </div>

      {tipos.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          Nenhum tipo ainda. Comece por algo como &quot;Ferramentas&quot; ou
          &quot;EPIs&quot;.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {tipos.map((tipo) => (
            <TipoLinha
              key={tipo.id}
              id={tipo.id}
              nome={tipo.nome}
              quantidadeMateriais={tipo._count.materiais}
            />
          ))}
        </ul>
      )}
    </>
  );
}
