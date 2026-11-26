import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowLeftRight,
  Package,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ListaEmprestimos } from "@/components/app/lista-emprestimos";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  estaAberto,
  estaAtrasado,
  listarEmprestimos,
  resumoDoPainel,
} from "@/lib/consultas";
import { HOJE } from "@/lib/mock-data";
import { formatarData } from "@/lib/formatar";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Painel" };

export default function PainelPage() {
  const resumo = resumoDoPainel();
  const emprestimos = listarEmprestimos();
  const atrasados = emprestimos.filter((emprestimo) =>
    estaAtrasado(emprestimo),
  );
  const emDia = emprestimos.filter(
    (emprestimo) => estaAberto(emprestimo) && !estaAtrasado(emprestimo),
  );

  return (
    <>
      <PageHeader
        titulo="Painel"
        descricao={`Situação em ${formatarData(HOJE)}`}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Indicador
          rotulo="Empréstimos abertos"
          valor={resumo.emprestimosAbertos}
          icone={ArrowLeftRight}
        />
        <Indicador
          rotulo="Atrasados"
          valor={resumo.atrasados}
          icone={AlertTriangle}
          alerta={resumo.atrasados > 0}
        />
        <Indicador
          rotulo="Unidades fora"
          valor={resumo.unidadesFora}
          icone={Package}
        />
        <Indicador
          rotulo="Colaboradores com material"
          valor={resumo.colaboradoresComMaterial}
          icone={Users}
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 font-medium">
          Atrasados
          {atrasados.length > 0 && (
            <span className="text-destructive text-sm font-normal">
              precisam ser cobrados
            </span>
          )}
        </h2>
        <ListaEmprestimos emprestimos={atrasados} vazio="Nenhum atraso." />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Em dia</h2>
          <Link
            href="/emprestimos"
            className="text-primary text-sm hover:underline"
          >
            Ver todos
          </Link>
        </div>
        <ListaEmprestimos
          emprestimos={emDia}
          vazio="Nenhum empréstimo aberto."
        />
      </section>
    </>
  );
}

type IndicadorProps = {
  rotulo: string;
  valor: number;
  icone: LucideIcon;
  alerta?: boolean;
};

function Indicador({
  rotulo,
  valor,
  icone: Icone,
  alerta = false,
}: IndicadorProps) {
  // "icone: Icone" na desestruturação = pega a prop `icone` e chama de `Icone` aqui dentro.
  return (
    <Card size="sm" className={cn(alerta && "ring-destructive/40")}>
      <CardContent>
        <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
          {rotulo}
          <Icone
            className={cn("size-4", alerta && "text-destructive")}
            aria-hidden="true"
          />
        </div>
        <div
          className={cn(
            "mt-2 text-3xl font-medium tabular-nums",
            alerta && "text-destructive",
          )}
        >
          {valor}
        </div>
      </CardContent>
    </Card>
  );
}
