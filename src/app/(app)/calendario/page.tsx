import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { StatusBadge } from "@/components/app/badges";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button";
import {
  dentroDoPeriodo,
  lerMes,
  limitesDoMes,
  mesParaTexto,
  mesVizinho,
  periodoDoEmprestimo,
  semanasDoMes,
} from "@/lib/calendario";
import { emprestimosNoIntervalo } from "@/lib/consultas";
import { fimDoDia, inicioDoDia, paraInputDate } from "@/lib/datas";
import { agora } from "@/lib/empresa-atual";
import { lerTexto } from "@/lib/filtros";
import { formatarData } from "@/lib/formatar";
import { diasDeAtraso, estaAtrasado } from "@/lib/regras";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Calendário" };

const DIAS_DA_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Uma cor por COLABORADOR: a mesma pessoa tem sempre a mesma cor no mês.
const CORES = [
  "bg-sky-100 text-sky-900 border-sky-300",
  "bg-amber-100 text-amber-900 border-amber-300",
  "bg-violet-100 text-violet-900 border-violet-300",
  "bg-emerald-100 text-emerald-900 border-emerald-300",
  "bg-rose-100 text-rose-900 border-rose-300",
  "bg-slate-200 text-slate-900 border-slate-400",
];

const MAXIMO_POR_DIA = 3;

export default async function CalendarioPage({
  searchParams,
}: PageProps<"/calendario">) {
  // /calendario?mes=2026-12 → dezembro de 2026. Sem ?mes → o mês atual.
  const [parametros, hoje] = await Promise.all([searchParams, agora()]);
  const mes = lerMes(lerTexto(parametros.mes), hoje);
  const semanas = semanasDoMes(mes);
  const diaDeHoje = paraInputDate(hoje);

  // Busca tudo que toca a GRADE (que pode começar no fim do mês anterior).
  const primeiroDaGrade = semanas[0][0];
  const ultimoDaGrade = semanas[semanas.length - 1][6];
  const emprestimos = await emprestimosNoIntervalo(
    inicioDoDia(primeiroDaGrade),
    fimDoDia(ultimoDaGrade),
  );

  // Cada colaborador ganha um número na ordem em que aparece (Map: id → número).
  const corDoColaborador = new Map<string, string>();
  for (const { colaborador } of emprestimos) {
    if (!corDoColaborador.has(colaborador.id)) {
      corDoColaborador.set(
        colaborador.id,
        CORES[corDoColaborador.size % CORES.length],
      );
    }
  }

  // Pra cada empréstimo, já calcula o que a tela precisa (período, cor, evento...).
  const noCalendario = emprestimos.map((emprestimo) => ({
    emprestimo,
    periodo: periodoDoEmprestimo(emprestimo, hoje),
    evento: emprestimo.dataEvento ? paraInputDate(emprestimo.dataEvento) : null,
    cor: corDoColaborador.get(emprestimo.colaborador.id) ?? CORES[0],
    atrasado: estaAtrasado(emprestimo, hoje),
    primeiroNome: emprestimo.colaborador.nome.split(" ")[0],
  }));

  const { inicio, fim } = limitesDoMes(mes);
  const doMes = noCalendario.filter(
    ({ periodo }) => periodo.inicio <= fim && periodo.fim >= inicio,
  );

  // timeZone UTC: a data foi montada em UTC, então formata em UTC (senão vira o mês anterior).
  // "novembro de 2026" → "Novembro de 2026" (só a primeira letra; o `capitalize` do CSS
  // deixaria "Novembro De 2026").
  const nomeEmMinusculas = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(mes.ano, mes.mes - 1, 1)));
  const nomeDoMes =
    nomeEmMinusculas.charAt(0).toUpperCase() + nomeEmMinusculas.slice(1);

  const linkDoMes = (deslocamento: number) =>
    `/calendario?mes=${mesParaTexto(mesVizinho(mes, deslocamento))}`;

  return (
    <>
      <PageHeader
        titulo="Calendário"
        descricao="Com quem está cada material, dia a dia"
      />

      {/* Navegação entre meses: links que mudam ?mes= */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-medium">{nomeDoMes}</h2>
        <nav aria-label="Trocar de mês" className="flex items-center gap-1">
          <Link
            href={linkDoMes(-1)}
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
            aria-label="Mês anterior"
          >
            <ChevronLeft />
          </Link>
          <Link
            href="/calendario"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Hoje
          </Link>
          <Link
            href={linkDoMes(1)}
            className={buttonVariants({ variant: "outline", size: "icon-sm" })}
            aria-label="Próximo mês"
          >
            <ChevronRight />
          </Link>
        </nav>
      </div>

      {/* A grade: 7 colunas (domingo a sábado), uma linha por semana. */}
      <div className="mb-8 overflow-hidden rounded-xl border">
        <div className="bg-muted/50 text-muted-foreground grid grid-cols-7 border-b text-center text-xs font-medium">
          {DIAS_DA_SEMANA.map((nome) => (
            <div key={nome} className="py-2">
              {nome}
            </div>
          ))}
        </div>

        {semanas.map((semana) => (
          <div
            key={semana[0]}
            className="grid grid-cols-7 border-b last:border-b-0"
          >
            {semana.map((d) => {
              const doOutroMes = d < inicio || d > fim;
              const ativos = noCalendario.filter((item) =>
                dentroDoPeriodo(d, item.periodo),
              );
              return (
                <div
                  key={d}
                  className={cn(
                    "min-h-16 border-r p-1 last:border-r-0 sm:min-h-28",
                    doOutroMes && "bg-muted/30",
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                      doOutroMes && "text-muted-foreground",
                      d === diaDeHoje &&
                        "bg-primary text-primary-foreground font-medium",
                    )}
                  >
                    {Number(d.slice(8))}
                  </div>

                  {/* Celular: só bolinhas coloridas (a lista abaixo tem os detalhes). */}
                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {ativos.map((item) => (
                      <span
                        key={item.emprestimo.id}
                        className={cn("size-2 rounded-full border", item.cor)}
                        aria-hidden="true"
                      />
                    ))}
                  </div>

                  {/* Computador: uma "etiqueta" por empréstimo, com link pro detalhe. */}
                  <ul className="hidden flex-col gap-0.5 sm:flex">
                    {ativos.slice(0, MAXIMO_POR_DIA).map((item) => {
                      const ehEvento = item.evento === d;
                      return (
                        <li key={item.emprestimo.id}>
                          <Link
                            href={`/emprestimos/${item.emprestimo.id}`}
                            title={`${item.emprestimo.colaborador.nome}${ehEvento ? ` · evento${item.emprestimo.localEvento ? `: ${item.emprestimo.localEvento}` : ""}` : ""}`}
                            className={cn(
                              "flex items-center gap-1 truncate rounded border px-1 text-[11px] leading-5",
                              item.cor,
                              item.emprestimo.status === "DEVOLVIDO" &&
                                "opacity-50",
                              ehEvento && "font-semibold ring-1 ring-current",
                            )}
                          >
                            {ehEvento && (
                              <CalendarDays
                                className="size-3 shrink-0"
                                aria-label="Dia do evento"
                              />
                            )}
                            {item.atrasado && d >= diaDeHoje && (
                              <AlertTriangle
                                className="size-3 shrink-0"
                                aria-label="Atrasado"
                              />
                            )}
                            <span className="truncate">
                              {item.primeiroNome}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                    {ativos.length > MAXIMO_POR_DIA && (
                      <li className="text-muted-foreground px-1 text-[11px]">
                        +{ativos.length - MAXIMO_POR_DIA}
                      </li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Lista do mês: os detalhes de cada empréstimo que aparece na grade. */}
      <section>
        <h2 className="mb-3 font-medium">Neste mês ({doMes.length})</h2>
        {doMes.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            Nenhum material com colaboradores neste mês.
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {doMes.map((item) => {
              const { emprestimo } = item;
              return (
                <li key={emprestimo.id}>
                  <Link
                    href={`/emprestimos/${emprestimo.id}`}
                    className="hover:bg-muted/50 flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <span
                      className={cn(
                        "h-3 w-3 shrink-0 rounded-full border",
                        item.cor,
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">
                        {emprestimo.colaborador.nome}
                      </div>
                      <div className="text-muted-foreground truncate text-sm">
                        {emprestimo.itens
                          .map(
                            (i) =>
                              `${i.quantidade > 1 ? `${i.quantidade}× ` : ""}${i.material.nome}`,
                          )
                          .join(", ")}
                      </div>
                      {(emprestimo.dataEvento || emprestimo.localEvento) && (
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm">
                          {emprestimo.dataEvento && (
                            <span className="flex items-center gap-1">
                              <CalendarDays
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              Evento {formatarData(emprestimo.dataEvento)}
                            </span>
                          )}
                          {emprestimo.localEvento && (
                            <span className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="size-3.5" aria-hidden="true" />
                              {emprestimo.localEvento}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-muted-foreground text-sm tabular-nums sm:text-right">
                      {formatarData(emprestimo.retiradoEm)} →{" "}
                      {formatarData(emprestimo.previsaoDevolucao)}
                    </div>
                    <StatusBadge
                      status={emprestimo.status}
                      diasAtrasado={diasDeAtraso(emprestimo, hoje)}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
