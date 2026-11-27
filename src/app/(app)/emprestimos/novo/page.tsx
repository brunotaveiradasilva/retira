import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { RetiradaFormulario } from "@/components/emprestimos/retirada-form";
import { opcoesDeRetirada } from "@/lib/consultas";
import { paraInputDate, somarDias } from "@/lib/datas";
import { agora } from "@/lib/empresa-atual";

export const metadata: Metadata = { title: "Nova retirada" };

export default async function NovaRetiradaPage({
  searchParams,
}: PageProps<"/emprestimos/novo">) {
  // searchParams: a parte "?colaborador=..." da URL. Também é uma Promise no Next 15+.
  const [{ colaborador }, opcoes, hoje] = await Promise.all([
    searchParams,
    opcoesDeRetirada(),
    agora(),
  ]);

  // Prazo sugerido: 7 dias. Calculado AQUI (no servidor) e passado pronto:
  // se o navegador calculasse, o HTML do servidor e o do navegador poderiam
  // ter datas diferentes (erro de "hydration").
  const prazo = somarDias(hoje, 7);

  // Só aceita o colaborador da URL se ele estiver na lista (ativo e desta empresa).
  const colaboradorInicial =
    typeof colaborador === "string" &&
    opcoes.colaboradores.some((c) => c.id === colaborador)
      ? colaborador
      : undefined;

  return (
    <>
      <PageHeader
        topo={
          <Link
            href="/emprestimos"
            className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Empréstimos
          </Link>
        }
        titulo="Nova retirada"
        descricao="Registre o que está saindo do almoxarifado e com quem."
      />
      <RetiradaFormulario
        {...opcoes}
        hoje={paraInputDate(hoje)}
        prazoSugerido={paraInputDate(prazo)}
        colaboradorInicial={colaboradorInicial}
      />
    </>
  );
}
