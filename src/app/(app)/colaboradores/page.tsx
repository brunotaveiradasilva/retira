import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { AvatarIniciais } from "@/components/app/avatar-iniciais";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Suspense } from "react";
import {
  BarraDeFiltros,
  CampoBusca,
  FiltroCheckbox,
} from "@/components/app/filtros-url";
import { listarColaboradores } from "@/lib/consultas";
import { lerTexto } from "@/lib/filtros";
import { agora } from "@/lib/empresa-atual";
import { estaAtrasado, unidadesPendentes } from "@/lib/regras";
import { formatarCodigo } from "@/lib/formatar";

export const metadata: Metadata = { title: "Colaboradores" };

export default async function ColaboradoresPage({
  searchParams,
}: PageProps<"/colaboradores">) {
  const parametros = await searchParams;
  const filtro = {
    busca: lerTexto(parametros.busca),
    incluirInativos: lerTexto(parametros.inativos) === "1",
  };
  const [hoje, colaboradores] = await Promise.all([
    agora(),
    listarColaboradores(filtro),
  ]);

  return (
    <>
      <PageHeader
        titulo="Colaboradores"
        descricao="Quem pode retirar material do almoxarifado"
        acoes={
          <Link href="/colaboradores/novo" className={buttonVariants()}>
            <Plus aria-hidden="true" /> Novo colaborador
          </Link>
        }
      />

      <Suspense>
        <BarraDeFiltros>
          <CampoBusca placeholder="Buscar por nome, código, matrícula ou setor" />
          <FiltroCheckbox parametro="inativos" rotulo="Mostrar inativos" />
        </BarraDeFiltros>
      </Suspense>

      {colaboradores.length === 0 && (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          {filtro.busca
            ? "Ninguém encontrado com essa busca."
            : "Nenhum colaborador ativo. Cadastre o primeiro."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colaboradores.map((colaborador) => {
          // colaborador.emprestimos já veio só com os abertos (veja listarColaboradores).
          const abertos = colaborador.emprestimos;
          const temAtraso = abertos.some((emprestimo) =>
            estaAtrasado(emprestimo, hoje),
          );
          const itensComEle = unidadesPendentes(abertos);

          return (
            <Link
              key={colaborador.id}
              href={`/colaboradores/${colaborador.id}`}
              className="rounded-xl focus-visible:outline-2"
            >
              <Card
                className={`hover:ring-primary/40 h-full transition-shadow ${colaborador.ativo ? "" : "opacity-60"}`}
              >
                <CardContent className="flex items-start gap-3">
                  <AvatarIniciais nome={colaborador.nome} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {colaborador.nome}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {[
                        `Cód. ${formatarCodigo(colaborador.numero)}`,
                        colaborador.setor,
                        colaborador.matricula &&
                          `Mat. ${colaborador.matricula}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!colaborador.ativo && (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                      {itensComEle > 0 ? (
                        <Badge
                          variant={temAtraso ? "destructive" : "secondary"}
                        >
                          {itensComEle} {itensComEle === 1 ? "item" : "itens"}{" "}
                          com ele(a)
                          {temAtraso && " · atrasado"}
                        </Badge>
                      ) : (
                        colaborador.ativo && (
                          <span className="text-muted-foreground text-xs">
                            Nada retirado
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
