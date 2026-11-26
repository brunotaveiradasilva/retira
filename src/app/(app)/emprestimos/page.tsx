import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { ListaEmprestimos } from "@/components/app/lista-emprestimos";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { estaAberto, listarEmprestimos } from "@/lib/consultas";

export const metadata: Metadata = { title: "Empréstimos" };

export default function EmprestimosPage() {
  const emprestimos = listarEmprestimos();
  const abertos = emprestimos.filter(estaAberto);
  const devolvidos = emprestimos.filter(
    (emprestimo) => !estaAberto(emprestimo),
  );

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
          vazio="Nenhum empréstimo aberto."
        />
      </section>

      <section>
        <h2 className="mb-3 font-medium">Devolvidos ({devolvidos.length})</h2>
        <ListaEmprestimos
          emprestimos={devolvidos}
          vazio="Nada devolvido ainda."
        />
      </section>
    </>
  );
}
