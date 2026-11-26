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
import type { EmprestimoDetalhado } from "@/lib/consultas";
import { formatarData } from "@/lib/formatar";
import { estaAtrasado } from "@/lib/regras";

type ListaEmprestimosProps = {
  /** Empréstimos já com colaborador e itens incluídos (veja `comDetalhes` em consultas.ts). */
  emprestimos: EmprestimoDetalhado[];
  /** Data de referência para saber o que está atrasado. */
  hoje: Date;
  /** Esconde a coluna do colaborador (na página do próprio colaborador ela é redundante). */
  semColaborador?: boolean;
  /** Mensagem quando a lista está vazia. */
  vazio?: string;
};

// Componente reaproveitado em 4 telas: painel, empréstimos, material e colaborador.
// Na fase 1 ele buscava o colaborador e cada material um por um. Agora os dados chegam
// prontos numa consulta só (include), e o componente só desenha.
export function ListaEmprestimos({
  emprestimos,
  hoje,
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
            const atrasado = estaAtrasado(emprestimo, hoje);
            return (
              <TableRow key={emprestimo.id}>
                {!semColaborador && (
                  <TableCell>
                    <Link
                      href={`/colaboradores/${emprestimo.colaborador.id}`}
                      className="font-medium hover:underline"
                    >
                      {emprestimo.colaborador.nome}
                    </Link>
                  </TableCell>
                )}
                <TableCell className="whitespace-normal">
                  <ul className="flex flex-col gap-0.5">
                    {emprestimo.itens.map((item) => (
                      <li
                        key={item.id}
                        className={
                          item.devolvidoEm
                            ? "text-muted-foreground line-through"
                            : ""
                        }
                      >
                        {item.quantidade > 1 && `${item.quantidade}× `}
                        <Link
                          href={`/materiais/${item.material.id}`}
                          className="hover:underline"
                        >
                          {item.material.nome}
                        </Link>
                      </li>
                    ))}
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
                  {/* O status leva ao detalhe do empréstimo (onde se registra a devolução). */}
                  <Link
                    href={`/emprestimos/${emprestimo.id}`}
                    aria-label="Abrir empréstimo"
                    className="rounded-md"
                  >
                    <StatusBadge
                      status={emprestimo.status}
                      atrasado={atrasado}
                    />
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
