"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { registrarDevolucaoAction } from "@/actions/emprestimos";
import { Button } from "@/components/ui/button";

type ItemPendente = {
  id: string;
  quantidade: number;
  material: { nome: string; codigo: string | null; controle: string };
};

type DevolucaoFormProps = {
  emprestimoId: string;
  itens: ItemPendente[];
};

/**
 * Marcar o que está voltando (tudo ou só parte) e o que voltou quebrado.
 * Aqui não usamos React Hook Form: são só checkboxes, e o estado cabe em dois Sets.
 */
export function DevolucaoFormulario({
  emprestimoId,
  itens,
}: DevolucaoFormProps) {
  // Set: coleção sem repetição. Começa com todos marcados (o caso mais comum: voltou tudo).
  const [voltando, setVoltando] = useState(
    () => new Set(itens.map((i) => i.id)),
  );
  const [danificados, setDanificados] = useState(() => new Set<string>());
  const [pendente, iniciarTransicao] = useTransition();

  // Estado no React é IMUTÁVEL: em vez de mudar o Set, criamos um novo.
  // Se mudássemos o mesmo objeto, o React não perceberia e não redesenharia.
  function alternar(conjunto: Set<string>, id: string): Set<string> {
    const novo = new Set(conjunto);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    return novo;
  }

  function confirmar() {
    iniciarTransicao(async () => {
      const resultado = await registrarDevolucaoAction(emprestimoId, {
        itemIds: [...voltando],
        danificados: [...danificados].filter((id) => voltando.has(id)),
      });
      if (resultado.ok) toast.success(resultado.mensagem);
      else toast.error(resultado.erro);
    });
  }

  const quantos = voltando.size;

  return (
    <div className="rounded-xl border">
      <ul className="divide-y">
        {itens.map((item) => {
          const marcado = voltando.has(item.id);
          const unitario = item.material.controle === "UNITARIO";
          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 px-4 py-3"
            >
              <label className="flex flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="accent-primary size-4"
                  checked={marcado}
                  onChange={() =>
                    setVoltando((atual) => alternar(atual, item.id))
                  }
                />
                <span>
                  {item.quantidade > 1 && `${item.quantidade}× `}
                  {item.material.nome}
                  {item.material.codigo && (
                    <span className="text-muted-foreground text-sm">
                      {" "}
                      ({item.material.codigo})
                    </span>
                  )}
                </span>
              </label>
              {/* "Voltou quebrado" só faz sentido para material unitário e marcado. */}
              {unitario && marcado && (
                <label className="text-muted-foreground flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-destructive size-4"
                    checked={danificados.has(item.id)}
                    onChange={() =>
                      setDanificados((atual) => alternar(atual, item.id))
                    }
                  />
                  Voltou danificado
                </label>
              )}
            </li>
          );
        })}
      </ul>
      <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
        <span className="text-muted-foreground text-sm">
          {quantos === 0
            ? "Marque o que está voltando."
            : quantos === itens.length
              ? "Devolução completa."
              : `Devolução parcial: ${quantos} de ${itens.length} itens.`}
        </span>
        <Button onClick={confirmar} disabled={pendente || quantos === 0}>
          {pendente ? "Registrando..." : "Registrar devolução"}
        </Button>
      </div>
    </div>
  );
}
