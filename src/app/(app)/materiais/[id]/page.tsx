import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { excluirMaterialAction } from "@/actions/materiais";
import { BotaoConfirmar } from "@/components/app/botao-confirmar";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button";
import { EstadoBadge } from "@/components/app/badges";
import { ListaEmprestimos } from "@/components/app/lista-emprestimos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buscarMaterial, listarEmprestimos } from "@/lib/consultas";
import { agora } from "@/lib/empresa-atual";
import {
  estaAberto,
  quantidadeDisponivel,
  unidadesPendentes,
} from "@/lib/regras";
import { formatarCodigo } from "@/lib/formatar";

// Fase 1 tinha generateStaticParams aqui: os ids eram fixos e o Next gerava as páginas no build.
// Agora os materiais vêm do banco e mudam a qualquer hora, então a página é montada
// a cada acesso. O loading.tsx desta pasta cobre a espera.

export async function generateMetadata({
  params,
}: PageProps<"/materiais/[id]">) {
  const { id } = await params;
  const material = await buscarMaterial(id);
  return { title: material?.nome ?? "Material" };
}

export default async function MaterialPage({
  params,
}: PageProps<"/materiais/[id]">) {
  const { id } = await params;
  const material = await buscarMaterial(id);
  if (!material) notFound();

  const [hoje, historico] = await Promise.all([
    agora(),
    listarEmprestimos({ materialId: material.id }),
  ]);
  const abertos = historico.filter(estaAberto);
  const emprestado = unidadesPendentes(abertos, material.id);

  return (
    <>
      <PageHeader
        topo={
          <Link
            href="/materiais"
            className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Materiais
          </Link>
        }
        titulo={material.nome}
        descricao={[
          `Código ${formatarCodigo(material.numero)}`,
          material.codigo && `Patrimônio ${material.codigo}`,
        ]
          .filter(Boolean)
          .join(" · ")}
        acoes={
          <div className="flex items-center gap-2">
            <EstadoBadge estado={material.estado} />
            <Link
              href={`/materiais/${material.id}/editar`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil aria-hidden="true" /> Editar
            </Link>
            {/* Server Component passando uma Server Action (com o id amarrado) pra um Client Component */}
            <BotaoConfirmar
              acao={excluirMaterialAction.bind(null, material.id)}
              titulo={`Excluir "${material.nome}"?`}
              descricao={
                historico.length > 0
                  ? "Este material já foi emprestado, então não pode ser excluído. Para tirar de uso, edite e mude o estado para Baixado."
                  : "Esta ação não pode ser desfeita."
              }
              rotulo="Excluir"
              irPara="/materiais"
              bloqueado={historico.length > 0}
              variante="outline"
              tamanho="sm"
            />
          </div>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Info rotulo="Total" valor={material.quantidade} />
        <Info rotulo="Emprestado" valor={emprestado} />
        <Info
          rotulo="Disponível"
          valor={quantidadeDisponivel(material, emprestado)}
        />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 font-medium">Com quem está agora</h2>
        <ListaEmprestimos
          emprestimos={abertos}
          hoje={hoje}
          vazio="Ninguém está com este material agora."
        />
      </section>

      <section>
        <h2 className="mb-3 font-medium">Histórico</h2>
        <ListaEmprestimos
          emprestimos={historico}
          hoje={hoje}
          vazio="Este material nunca foi emprestado."
        />
      </section>
    </>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-muted-foreground text-sm font-normal">
          {rotulo}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-medium tabular-nums">
        {valor}
      </CardContent>
    </Card>
  );
}
