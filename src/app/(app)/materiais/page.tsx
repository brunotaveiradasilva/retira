import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EstadoBadge } from "@/components/app/badges";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Suspense } from "react";
import {
  BarraDeFiltros,
  CampoBusca,
  FiltroSelect,
} from "@/components/app/filtros-url";
import {
  listarMateriais,
  listarTipos,
  unidadesEmprestadasPorMaterial,
} from "@/lib/consultas";
import { lerOpcao, lerTexto } from "@/lib/filtros";
import { nomeDoEstado } from "@/lib/formatar";
import { quantidadeDisponivel } from "@/lib/regras";
import type { EstadoMaterial } from "@/types";

export const metadata: Metadata = { title: "Materiais" };

const ESTADOS = Object.keys(nomeDoEstado) as EstadoMaterial[];

export default async function MateriaisPage({
  searchParams,
}: PageProps<"/materiais">) {
  // /materiais?busca=fur&tipo=<id>&estado=BOM → cada parte vira um filtro no banco.
  const parametros = await searchParams;
  const filtro = {
    busca: lerTexto(parametros.busca),
    tipoId: lerTexto(parametros.tipo),
    estado: lerOpcao(parametros.estado, ESTADOS), // valor fora da lista → sem filtro
  };
  const filtrando = Boolean(filtro.busca || filtro.tipoId || filtro.estado);

  // Três consultas independentes: em paralelo.
  const [materiais, emprestadas, tipos] = await Promise.all([
    listarMateriais(filtro),
    unidadesEmprestadasPorMaterial(),
    listarTipos(),
  ]);

  return (
    <>
      <PageHeader
        titulo="Materiais"
        descricao={
          filtrando
            ? `${materiais.length} encontrado(s)`
            : `${materiais.length} materiais cadastrados`
        }
        acoes={
          <Link href="/materiais/novo" className={buttonVariants()}>
            <Plus aria-hidden="true" /> Novo material
          </Link>
        }
      />

      {/* Os filtros são Client Components que leem a URL (useSearchParams):
          precisam de um Suspense em volta. */}
      <Suspense>
        <BarraDeFiltros>
          <CampoBusca placeholder="Buscar por nome ou código" />
          <FiltroSelect
            parametro="tipo"
            rotulo="Filtrar por tipo"
            opcoes={[
              { valor: "", rotulo: "Todos os tipos" },
              ...tipos.map((tipo) => ({ valor: tipo.id, rotulo: tipo.nome })),
            ]}
          />
          <FiltroSelect
            parametro="estado"
            rotulo="Filtrar por estado"
            opcoes={[
              { valor: "", rotulo: "Qualquer estado" },
              ...ESTADOS.map((estado) => ({
                valor: estado,
                rotulo: nomeDoEstado[estado],
              })),
            ]}
          />
        </BarraDeFiltros>
      </Suspense>

      {materiais.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          {filtrando
            ? "Nenhum material com esses filtros."
            : "Nenhum material cadastrado ainda."}
        </p>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="text-right">Disponível</TableHead>
                <TableHead className="hidden sm:table-cell">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materiais.map((material) => {
                const disponivel = quantidadeDisponivel(
                  material,
                  emprestadas.get(material.id) ?? 0,
                );
                return (
                  <TableRow key={material.id}>
                    <TableCell>
                      <Link
                        href={`/materiais/${material.id}`}
                        className="font-medium hover:underline"
                      >
                        {material.nome}
                      </Link>
                      {material.codigo && (
                        <div className="text-muted-foreground text-xs">
                          {material.codigo}
                        </div>
                      )}
                    </TableCell>
                    {/* material.tipo veio junto pelo include: { tipo: true } */}
                    <TableCell className="hidden sm:table-cell">
                      {material.tipo.nome}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          disponivel === 0 ? "text-muted-foreground" : ""
                        }
                      >
                        {disponivel}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / {material.quantidade}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <EstadoBadge estado={material.estado} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
