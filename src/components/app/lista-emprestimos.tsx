import Link from "next/link";
import { StatusBadge } from "@/components/app/badges";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buscarColaborador,
  buscarMaterial,
  estaAtrasado,
} from "@/lib/consultas";
import { formatarData } from "@/lib/formatar";
import type { Emprestimo } from "@/types";

type ListaEmprestimosProps = {
  emprestimos: Emprestimo[];
  /** Esconde a coluna do colaborador (na página do próprio colaborador ela é redundante). */
  semColaborador?: boolean;
  /** Mensagem quando a lista está vazia. */
  vazio?: string;
};

// Componente reaproveitado em 4 telas: painel, empréstimos, material e colaborador.
// É pra isso que servem componentes: escrever uma vez, usar em vários lugares.
export function ListaEmprestimos({
  emprestimos,
  semColaborador = false,
  vazio = "Nenhum empréstimo.",
}: ListaEmprestimosProps) {
  if (emprestimos.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
        {vazio}
      </p>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {!semColaborador && <TableHead>Colaborador</TableHead>}
            <TableHead>Itens</TableHead>
            <TableHead className="hidden md:table-cell">Retirada</TableHead>
            <TableHead className="hidden md:table-cell">Devolver até</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {emprestimos.map((emprestimo) => {
            const colaborador = buscarColaborador(emprestimo.colaboradorId);
            const atrasado = estaAtrasado(emprestimo);
            return (
              <TableRow key={emprestimo.id}>
                {!semColaborador && (
                  <TableCell>
                    {colaborador ? (
                      <Link
                        href={`/colaboradores/${colaborador.id}`}
                        className="font-medium hover:underline"
                      >
                        {colaborador.nome}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                )}
                <TableCell className="whitespace-normal">
                  <ul className="flex flex-col gap-0.5">
                    {emprestimo.itens.map((item) => {
                      const material = buscarMaterial(item.materialId);
                      return (
                        <li
                          key={item.materialId}
                          className={
                            item.devolvidoEm
                              ? "text-muted-foreground line-through"
                              : ""
                          }
                        >
                          {item.quantidade > 1 && `${item.quantidade}× `}
                          {material ? (
                            <Link
                              href={`/materiais/${material.id}`}
                              className="hover:underline"
                            >
                              {material.nome}
                            </Link>
                          ) : (
                            "material removido"
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </TableCell>
                <TableCell className="hidden tabular-nums md:table-cell">
                  {formatarData(emprestimo.retiradoEm)}
                </TableCell>
                <TableCell
                  className={`hidden tabular-nums md:table-cell ${atrasado ? "text-destructive font-medium" : ""}`}
                >
                  {formatarData(emprestimo.previsaoDevolucao)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={emprestimo.status} atrasado={atrasado} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
