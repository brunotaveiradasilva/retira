import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Printer } from "lucide-react";
import { StatusBadge } from "@/components/app/badges";
import { PageHeader } from "@/components/app/page-header";
import { DevolucaoFormulario } from "@/components/emprestimos/devolucao-form";
import { buttonVariants } from "@/components/ui/button";
import { buscarEmprestimo } from "@/lib/consultas";
import { agora } from "@/lib/empresa-atual";
import { formatarData } from "@/lib/formatar";
import { diasDeAtraso, estaAtrasado } from "@/lib/regras";

export async function generateMetadata({
  params,
}: PageProps<"/emprestimos/[id]">) {
  const { id } = await params;
  const emprestimo = await buscarEmprestimo(id);
  return {
    title: emprestimo
      ? `Retirada de ${emprestimo.colaborador.nome}`
      : "Empréstimo",
  };
}

export default async function EmprestimoPage({
  params,
}: PageProps<"/emprestimos/[id]">) {
  const { id } = await params;
  const [emprestimo, hoje] = await Promise.all([buscarEmprestimo(id), agora()]);
  if (!emprestimo) notFound();

  const pendentes = emprestimo.itens.filter((item) => !item.devolvidoEm);
  const devolvidos = emprestimo.itens.filter((item) => item.devolvidoEm);
  const atrasado = estaAtrasado(emprestimo, hoje);

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
        titulo={`Retirada de ${emprestimo.colaborador.nome}`}
        descricao={`Retirado em ${formatarData(emprestimo.retiradoEm)}`}
        acoes={
          <div className="flex items-center gap-2">
            <StatusBadge
              status={emprestimo.status}
              diasAtrasado={diasDeAtraso(emprestimo, hoje)}
            />
            <Link
              href={`/emprestimos/${emprestimo.id}/termo`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Printer aria-hidden="true" /> Termo
            </Link>
          </div>
        }
      />

      <dl className="mb-8 grid gap-4 rounded-xl border p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Colaborador</dt>
          <dd>
            <Link
              href={`/colaboradores/${emprestimo.colaborador.id}`}
              className="font-medium hover:underline"
            >
              {emprestimo.colaborador.nome}
            </Link>
            {emprestimo.colaborador.setor &&
              ` · ${emprestimo.colaborador.setor}`}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Período</dt>
          <dd>
            {formatarData(emprestimo.retiradoEm)}
            {" → "}
            <span className={atrasado ? "text-destructive font-medium" : ""}>
              {formatarData(emprestimo.previsaoDevolucao)}
              {atrasado && " (atrasado)"}
            </span>
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Observação</dt>
          <dd>{emprestimo.observacao ?? "—"}</dd>
        </div>

        {/* Só aparece se houver algum dado de evento. */}
        {(emprestimo.dataEvento ||
          emprestimo.localEvento ||
          emprestimo.enderecoEvento) && (
          <div className="border-t pt-4 sm:col-span-3">
            <dt className="text-muted-foreground flex items-center gap-1">
              <CalendarDays className="size-4" aria-hidden="true" /> Evento
            </dt>
            <dd className="mt-1">
              {emprestimo.dataEvento && (
                <span className="font-medium">
                  {formatarData(emprestimo.dataEvento)}
                </span>
              )}
              {emprestimo.localEvento && (
                <>
                  {emprestimo.dataEvento && " · "}
                  {emprestimo.localEvento}
                </>
              )}
              {emprestimo.enderecoEvento && (
                <div className="mt-1">
                  {/* Link pro Google Maps com o endereço. encodeURIComponent troca espaços
                      e acentos pelos códigos que uma URL aceita. */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emprestimo.enderecoEvento)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    <MapPin className="size-4" aria-hidden="true" />
                    {emprestimo.enderecoEvento}
                  </a>
                </div>
              )}
            </dd>
          </div>
        )}
      </dl>

      {pendentes.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-medium">Pendentes ({pendentes.length})</h2>
          {/* O formulário (cliente) recebe só o necessário, não o objeto inteiro do banco.
              key: quando a lista de pendentes muda (depois de uma devolução parcial), a key
              muda e o React RECRIA o componente, zerando as caixinhas marcadas. Sem isso
              ele manteria a seleção antiga, com ids de itens que já voltaram. */}
          <DevolucaoFormulario
            key={pendentes.map((item) => item.id).join(",")}
            emprestimoId={emprestimo.id}
            itens={pendentes.map((item) => ({
              id: item.id,
              quantidade: item.quantidade,
              material: {
                numero: item.material.numero,
                nome: item.material.nome,
                codigo: item.material.codigo,
                controle: item.material.controle,
              },
            }))}
          />
        </section>
      )}

      {devolvidos.length > 0 && (
        <section>
          <h2 className="mb-3 font-medium">Devolvidos ({devolvidos.length})</h2>
          <ul className="divide-y rounded-xl border">
            {devolvidos.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <Link
                  href={`/materiais/${item.material.id}`}
                  className="hover:underline"
                >
                  {item.quantidade > 1 && `${item.quantidade}× `}
                  {item.material.nome}
                </Link>
                <span className="text-muted-foreground text-sm">
                  em {formatarData(item.devolvidoEm)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
