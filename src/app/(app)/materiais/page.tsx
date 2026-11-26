import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { EstadoBadge } from "@/components/app/badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buscarTipo,
  listarMateriais,
  quantidadeDisponivel,
} from "@/lib/consultas";

export const metadata: Metadata = { title: "Materiais" };

export default function MateriaisPage() {
  const materiais = listarMateriais();

  return (
    <>
      <PageHeader
        titulo="Materiais"
        descricao={`${materiais.length} materiais cadastrados`}
        acoes={
          <Button disabled>
            <Plus aria-hidden="true" /> Novo material
          </Button>
        }
      />

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
              const disponivel = quantidadeDisponivel(material);
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
                  <TableCell className="hidden sm:table-cell">
                    {buscarTipo(material.tipoId)?.nome}
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
    </>
  );
}
