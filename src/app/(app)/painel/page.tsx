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
import { listarEmprestimos, resumoDoPainel } from "@/lib/consultas";
import { agora } from "@/lib/empresa-atual";
import { formatarData } from "@/lib/formatar";
import { estaAtrasado } from "@/lib/regras";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Painel" };

// async: a página espera o banco responder antes de desenhar.
// Enquanto isso, o (app)/loading.tsx aparece na tela.
export default async function PainelPage() {
  const hoje = await agora();
  const [resumo, abertos] = await Promise.all([
    resumoDoPainel(hoje),
    listarEmprestimos({ abertos: true }),
  ]);
  const atrasados = abertos.filter((emprestimo) =>
    estaAtrasado(emprestimo, hoje),
  );
  const emDia = abertos.filter((emprestimo) => !estaAtrasado(emprestimo, hoje));

  return (
    <>
      <PageHeader
        titulo="Painel"
        descricao={`Situação em ${formatarData(hoje)}`}
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
        <ListaEmprestimos
          emprestimos={atrasados}
          hoje={hoje}
          vazio="Nenhum atraso."
        />
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
          hoje={hoje}
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
