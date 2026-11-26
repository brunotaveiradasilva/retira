import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { AvatarIniciais } from "@/components/app/avatar-iniciais";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  emprestimosDoColaborador,
  estaAberto,
  estaAtrasado,
  listarColaboradores,
} from "@/lib/consultas";

export const metadata: Metadata = { title: "Colaboradores" };

export default function ColaboradoresPage() {
  const colaboradores = listarColaboradores();

  return (
    <>
      <PageHeader
        titulo="Colaboradores"
        descricao="Quem pode retirar material do almoxarifado"
        acoes={
          <Button disabled>
            <Plus aria-hidden="true" /> Novo colaborador
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {colaboradores.map((colaborador) => {
          const abertos = emprestimosDoColaborador(colaborador.id).filter(
            estaAberto,
          );
          const temAtraso = abertos.some((emprestimo) =>
            estaAtrasado(emprestimo),
          );
          // Soma só os itens que ainda não voltaram.
          const itensComEle = abertos
            .flatMap((emprestimo) => emprestimo.itens)
            .filter((item) => !item.devolvidoEm)
            .reduce((soma, item) => soma + item.quantidade, 0);

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
