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
  listarEmprestimos,
  materiaisMaisEmprestados,
  resumoDoPainel,
} from "@/lib/consultas";
import { agora } from "@/lib/empresa-atual";
import { formatarData } from "@/lib/formatar";
import { estaAtrasado, venceEmBreve } from "@/lib/regras";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Painel" };

export default async function PainelPage() {
  const hoje = await agora();
  const [resumo, abertos, maisEmprestados] = await Promise.all([
    resumoDoPainel(hoje),
    listarEmprestimos({ abertos: true }),
    materiaisMaisEmprestados(),
  ]);

  // Os atrasados mais antigos primeiro: são os mais urgentes de cobrar.
  const atrasados = abertos
    .filter((emprestimo) => estaAtrasado(emprestimo, hoje))
    .sort(
      (a, b) =>
        (a.previsaoDevolucao?.getTime() ?? 0) -
        (b.previsaoDevolucao?.getTime() ?? 0),
    );
  const vencendo = abertos.filter((emprestimo) =>
    venceEmBreve(emprestimo, hoje, 3),
  );
  const maiorQuantidade = maisEmprestados[0]?.unidades ?? 0;

  return (
    <>
      <PageHeader
        titulo="Painel"
        descricao={`Situação em ${formatarData(hoje)}`}
      />

      {/* Cada indicador leva à lista já filtrada (o filtro mora na URL). */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Indicador
          rotulo="Empréstimos abertos"
          valor={resumo.emprestimosAbertos}
          icone={ArrowLeftRight}
          href="/emprestimos"
        />
        <Indicador
          rotulo="Atrasados"
          valor={resumo.atrasados}
          icone={AlertTriangle}
          alerta={resumo.atrasados > 0}
          href="/emprestimos?situacao=atrasados"
        />
        <Indicador
          rotulo="Unidades fora"
          valor={resumo.unidadesFora}
          icone={Package}
          href="/materiais"
        />
        <Indicador
          rotulo="Colaboradores com material"
          valor={resumo.colaboradoresComMaterial}
          icone={Users}
          href="/colaboradores"
        />
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-medium">
            Atrasados
            {atrasados.length > 0 && (
              <span className="text-destructive text-sm font-normal">
                precisam ser cobrados
              </span>
            )}
          </h2>
          {atrasados.length > 5 && (
            <Link
              href="/emprestimos?situacao=atrasados"
              className="text-primary text-sm hover:underline"
            >
              Ver todos ({atrasados.length})
            </Link>
          )}
        </div>
        <ListaEmprestimos
          emprestimos={atrasados.slice(0, 5)}
          hoje={hoje}
          vazio="Nenhum atraso."
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <section>
          <h2 className="mb-3 font-medium">Vencem nos próximos 3 dias</h2>
          <ListaEmprestimos
            emprestimos={vencendo}
            hoje={hoje}
            vazio="Nada vencendo nos próximos dias."
          />
        </section>

        <section>
          <h2 className="mb-3 font-medium">Mais emprestados</h2>
          {maisEmprestados.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
              Nenhuma retirada ainda.
            </p>
          ) : (
            <ol className="flex flex-col gap-3 rounded-xl border p-4">
              {maisEmprestados.map((material) => (
                <li key={material.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <Link
                      href={`/materiais/${material.id}`}
                      className="truncate hover:underline"
                    >
                      {material.nome}
                    </Link>
                    <span className="text-muted-foreground shrink-0 tabular-nums">
                      {material.unidades} un. · {material.retiradas}{" "}
                      {material.retiradas === 1 ? "retirada" : "retiradas"}
                    </span>
                  </div>
                  {/* Barra proporcional ao maior: só uma div com largura em %. */}
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        width: `${(material.unidades / maiorQuantidade) * 100}%`,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

type IndicadorProps = {
  rotulo: string;
  valor: number;
  icone: LucideIcon;
  href: string;
  alerta?: boolean;
};

function Indicador({
  rotulo,
  valor,
  icone: Icone,
  href,
  alerta = false,
}: IndicadorProps) {
  return (
    <Link href={href} className="rounded-xl focus-visible:outline-2">
      <Card
        size="sm"
        className={cn(
          "hover:ring-primary/40 h-full transition-shadow",
          alerta && "ring-destructive/40",
        )}
      >
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
    </Link>
  );
}
