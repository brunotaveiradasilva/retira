import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { AvatarIniciais } from "@/components/app/avatar-iniciais";
import { ListaEmprestimos } from "@/components/app/lista-emprestimos";
import { Badge } from "@/components/ui/badge";
import {
  buscarColaborador,
  emprestimosDoColaborador,
  estaAberto,
  listarColaboradores,
} from "@/lib/consultas";

export function generateStaticParams() {
  return listarColaboradores().map((colaborador) => ({ id: colaborador.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/colaboradores/[id]">) {
  const { id } = await params;
  return { title: buscarColaborador(id)?.nome ?? "Colaborador" };
}

export default async function ColaboradorPage({
  params,
}: PageProps<"/colaboradores/[id]">) {
  const { id } = await params;
  const colaborador = buscarColaborador(id);
  if (!colaborador) notFound();

  const historico = emprestimosDoColaborador(colaborador.id);
  const abertos = historico.filter(estaAberto);
  const devolvidos = historico.filter((emprestimo) => !estaAberto(emprestimo));

  return (
    <>
      <Link
        href="/colaboradores"
        className="text-muted-foreground hover:text-foreground mb-4 flex w-fit items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Colaboradores
      </Link>

      <div className="mb-8 flex items-center gap-4">
        <AvatarIniciais nome={colaborador.nome} className="size-14 text-lg" />
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-medium tracking-tight">
            {colaborador.nome}
            {!colaborador.ativo && <Badge variant="outline">Inativo</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm">
            {[
              colaborador.setor,
              colaborador.matricula && `Matrícula ${colaborador.matricula}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {colaborador.telefone && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
              <Phone className="size-3.5" aria-hidden="true" />
              {colaborador.telefone}
            </p>
          )}
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-medium">Com ele(a) agora</h2>
        <ListaEmprestimos
          emprestimos={abertos}
          semColaborador
          vazio="Nenhum material com este colaborador."
        />
      </section>

      <section>
        <h2 className="mb-3 font-medium">Já devolvidos</h2>
        <ListaEmprestimos
          emprestimos={devolvidos}
          semColaborador
          vazio="Nenhuma devolução ainda."
        />
      </section>
    </>
  );
}
