import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BotaoImprimir } from "@/components/emprestimos/botao-imprimir";
import { buscarEmprestimo } from "@/lib/consultas";
import { formatarData } from "@/lib/formatar";

export const metadata = { title: "Termo de responsabilidade" };

// Página feita pra papel. As classes `print:` do Tailwind valem só na impressão:
//   print:hidden  → some no papel (botões, menu)
//   print:p-0     → tira o espaçamento da tela
// O layout (app) também esconde a barra lateral com print:hidden.
export default async function TermoPage({
  params,
}: PageProps<"/emprestimos/[id]/termo">) {
  const { id } = await params;
  const emprestimo = await buscarEmprestimo(id);
  if (!emprestimo) notFound();

  const { colaborador, empresa } = emprestimo;

  return (
    <>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/emprestimos/${emprestimo.id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Voltar ao
          empréstimo
        </Link>
        <BotaoImprimir />
      </div>

      <article className="mx-auto max-w-2xl rounded-xl border bg-white p-8 text-sm leading-relaxed text-black print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="mb-6 border-b pb-4 text-center">
          <div className="text-base font-medium">{empresa.nome}</div>
          {empresa.cnpj && <div className="text-xs">CNPJ {empresa.cnpj}</div>}
          <h1 className="mt-4 text-lg font-medium tracking-tight">
            Termo de responsabilidade pela guarda de material
          </h1>
        </header>

        <p className="mb-4">
          Eu, <strong>{colaborador.nome}</strong>
          {colaborador.matricula && <>, matrícula {colaborador.matricula}</>}
          {colaborador.setor && <>, do setor {colaborador.setor}</>}, declaro
          ter recebido em <strong>{formatarData(emprestimo.retiradoEm)}</strong>{" "}
          os materiais abaixo, em perfeito estado de conservação e
          funcionamento, comprometendo-me a zelar por eles e devolvê-los
          {emprestimo.previsaoDevolucao ? (
            <>
              {" "}
              até <strong>{formatarData(emprestimo.previsaoDevolucao)}</strong>
            </>
          ) : (
            " quando solicitado"
          )}
          .
        </p>

        <table className="mb-4 w-full border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-1 pr-2 font-medium">Qtd.</th>
              <th className="py-1 pr-2 font-medium">Material</th>
              <th className="py-1 font-medium">Código</th>
            </tr>
          </thead>
          <tbody>
            {emprestimo.itens.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-1 pr-2 tabular-nums">{item.quantidade}</td>
                <td className="py-1 pr-2">{item.material.nome}</td>
                <td className="py-1">{item.material.codigo ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {emprestimo.observacao && (
          <p className="mb-4">
            <strong>Observação:</strong> {emprestimo.observacao}
          </p>
        )}

        <p className="mb-12">
          Em caso de perda, dano por mau uso ou não devolução, comprometo-me a
          comunicar imediatamente o responsável pelo almoxarifado.
        </p>

        <div className="grid grid-cols-2 gap-12 pt-8">
          <div className="border-t pt-2 text-center">
            {colaborador.nome}
            <div className="text-xs">Colaborador(a)</div>
          </div>
          <div className="border-t pt-2 text-center">
            Responsável pelo almoxarifado
            <div className="text-xs">{empresa.nome}</div>
          </div>
        </div>
      </article>
    </>
  );
}
