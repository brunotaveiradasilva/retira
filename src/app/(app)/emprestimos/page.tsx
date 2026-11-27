import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { BarraDeFiltros, CampoBusca } from "@/components/app/filtros-url";
import { ListaEmprestimos } from "@/components/app/lista-emprestimos";
import { PageHeader } from "@/components/app/page-header";
import { Paginacao } from "@/components/app/paginacao";
import { buttonVariants } from "@/components/ui/button";
import { paginarEmprestimos, SITUACOES, type Situacao } from "@/lib/consultas";
import { agora } from "@/lib/empresa-atual";
import { lerOpcao, lerPagina, lerTexto, urlCom } from "@/lib/filtros";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Empréstimos" };

const ROTULOS: Record<Situacao, string> = {
  abertos: "Em aberto",
  atrasados: "Atrasados",
  devolvidos: "Devolvidos",
  todos: "Todos",
};

const VAZIO: Record<Situacao, string> = {
  abertos: "Nenhum empréstimo em aberto.",
  atrasados: "Nenhum atraso.",
  devolvidos: "Nada devolvido ainda.",
  todos: "Nenhum empréstimo registrado.",
};

export default async function EmprestimosPage({
  searchParams,
}: PageProps<"/emprestimos">) {
  // /emprestimos?situacao=atrasados&busca=ana&pagina=2
  const parametros = await searchParams;
  const situacao = lerOpcao(parametros.situacao, SITUACOES, "abertos");
  const busca = lerTexto(parametros.busca);
  const pagina = lerPagina(parametros.pagina);

  const hoje = await agora();
  const { itens, total, totalDePaginas } = await paginarEmprestimos({
    situacao,
    busca,
    pagina,
    hoje,
  });

  return (
    <>
      <PageHeader
        titulo="Empréstimos"
        descricao="Retiradas e devoluções do almoxarifado"
        acoes={
          <Link href="/emprestimos/novo" className={buttonVariants()}>
            <Plus aria-hidden="true" /> Nova retirada
          </Link>
        }
      />

      {/* Abas: são só LINKS que mudam ?situacao=. Nenhum JavaScript necessário. */}
      <nav aria-label="Situação" className="mb-4 flex flex-wrap gap-1 border-b">
        {SITUACOES.map((opcao) => {
          const ativa = opcao === situacao;
          return (
            <Link
              key={opcao}
              href={urlCom("/emprestimos", parametros, {
                situacao: opcao === "abertos" ? undefined : opcao,
                pagina: undefined, // trocou de aba → página 1
              })}
              aria-current={ativa ? "page" : undefined}
              scroll={false}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
                ativa
                  ? "border-primary text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {ROTULOS[opcao]}
            </Link>
          );
        })}
      </nav>

      <Suspense>
        <BarraDeFiltros>
          <CampoBusca placeholder="Buscar por colaborador" />
          <span className="text-muted-foreground text-sm">
            {total} {total === 1 ? "empréstimo" : "empréstimos"}
          </span>
        </BarraDeFiltros>
      </Suspense>

      <ListaEmprestimos
        emprestimos={itens}
        hoje={hoje}
        vazio={busca ? "Nada encontrado com essa busca." : VAZIO[situacao]}
      />

      <Paginacao
        caminho="/emprestimos"
        parametros={parametros}
        pagina={pagina}
        totalDePaginas={totalDePaginas}
      />
    </>
  );
}
