import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, Pencil, Phone } from "lucide-react";
import {
  alterarAtivoAction,
  excluirColaboradorAction,
} from "@/actions/colaboradores";
import { AvatarIniciais } from "@/components/app/avatar-iniciais";
import { BotaoConfirmar } from "@/components/app/botao-confirmar";
import { buttonVariants } from "@/components/ui/button";
import { ListaEmprestimos } from "@/components/app/lista-emprestimos";
import { Badge } from "@/components/ui/badge";
import { buscarColaborador, listarEmprestimos } from "@/lib/consultas";
import { agora } from "@/lib/empresa-atual";
import { formatarCodigo } from "@/lib/formatar";

export async function generateMetadata({
  params,
}: PageProps<"/colaboradores/[id]">) {
  const { id } = await params;
  const colaborador = await buscarColaborador(id);
  return { title: colaborador?.nome ?? "Colaborador" };
}

export default async function ColaboradorPage({
  params,
}: PageProps<"/colaboradores/[id]">) {
  const { id } = await params;
  const colaborador = await buscarColaborador(id);
  if (!colaborador) notFound();

  const [hoje, abertos, devolvidos] = await Promise.all([
    agora(),
    listarEmprestimos({ colaboradorId: colaborador.id, abertos: true }),
    listarEmprestimos({ colaboradorId: colaborador.id, abertos: false }),
  ]);

  return (
    <>
      <Link
        href="/colaboradores"
        className="text-muted-foreground hover:text-foreground mb-4 flex w-fit items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Colaboradores
      </Link>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <AvatarIniciais nome={colaborador.nome} className="size-14 text-lg" />
        <div className="flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-medium tracking-tight">
            {colaborador.nome}
            {!colaborador.ativo && <Badge variant="outline">Inativo</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm">
            {[
              `Código ${formatarCodigo(colaborador.numero)}`,
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

        <div className="flex flex-wrap items-center gap-2">
          {colaborador.ativo && (
            // ?colaborador=id: a tela de retirada já abre com ele escolhido
            <Link
              href={`/emprestimos/novo?colaborador=${colaborador.id}`}
              className={buttonVariants({ size: "sm" })}
            >
              <ArrowLeftRight aria-hidden="true" /> Nova retirada
            </Link>
          )}
          <Link
            href={`/colaboradores/${colaborador.id}/editar`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Pencil aria-hidden="true" /> Editar
          </Link>
          <BotaoConfirmar
            acao={alterarAtivoAction.bind(
              null,
              colaborador.id,
              !colaborador.ativo,
            )}
            titulo={
              colaborador.ativo
                ? `Desativar ${colaborador.nome}?`
                : `Reativar ${colaborador.nome}?`
            }
            descricao={
              colaborador.ativo
                ? abertos.length > 0
                  ? `Ainda está com material (${abertos.length} empréstimo(s) em aberto). Desativar não devolve nada: lembre de cobrar.`
                  : "Ele(a) deixa de aparecer como opção em novas retiradas. Dá pra reativar depois."
                : "Ele(a) volta a poder retirar material."
            }
            rotulo={colaborador.ativo ? "Desativar" : "Reativar"}
            destrutivo={false}
            variante="outline"
            tamanho="sm"
          />
          <BotaoConfirmar
            acao={excluirColaboradorAction.bind(null, colaborador.id)}
            titulo={`Excluir ${colaborador.nome}?`}
            descricao={
              abertos.length + devolvidos.length > 0
                ? "Tem empréstimos no histórico, então não pode ser excluído. Use Desativar."
                : "Esta ação não pode ser desfeita."
            }
            rotulo="Excluir"
            irPara="/colaboradores"
            bloqueado={abertos.length + devolvidos.length > 0}
            variante="outline"
            tamanho="sm"
          />
        </div>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-medium">Com ele(a) agora</h2>
        <ListaEmprestimos
          emprestimos={abertos}
          hoje={hoje}
          semColaborador
          vazio="Nenhum material com este colaborador."
        />
      </section>

      <section>
        <h2 className="mb-3 font-medium">Já devolvidos</h2>
        <ListaEmprestimos
          emprestimos={devolvidos}
          hoje={hoje}
          semColaborador
          vazio="Nenhuma devolução ainda."
        />
      </section>
    </>
  );
}
