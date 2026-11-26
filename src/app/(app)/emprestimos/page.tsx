import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { ListaEmprestimos } from "@/components/app/lista-emprestimos";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { listarEmprestimos } from "@/lib/consultas";
import { agora } from "@/lib/empresa-atual";

export const metadata: Metadata = { title: "Empréstimos" };

export default async function EmprestimosPage() {
  // O filtro agora roda no banco (WHERE status ...), não no JavaScript.
  const [hoje, abertos, devolvidos] = await Promise.all([
    agora(),
    listarEmprestimos({ abertos: true }),
    listarEmprestimos({ abertos: false }),
  ]);

  return (
    <>
      <PageHeader
        titulo="Empréstimos"
        descricao="Retiradas e devoluções do almoxarifado"
        acoes={
          <Button disabled>
            <Plus aria-hidden="true" /> Nova retirada
          </Button>
        }
      />

      <section className="mb-8">
        <h2 className="mb-3 font-medium">Abertos ({abertos.length})</h2>
        <ListaEmprestimos
          emprestimos={abertos}
          hoje={hoje}
          vazio="Nenhum empréstimo aberto."
        />
      </section>

      <section>
        <h2 className="mb-3 font-medium">Devolvidos ({devolvidos.length})</h2>
        <ListaEmprestimos
          emprestimos={devolvidos}
          hoje={hoje}
          vazio="Nada devolvido ainda."
        />
      </section>
    </>
  );
}
