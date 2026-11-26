"use client";

import { useActionState, useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { excluirTipoAction, renomearTipoAction } from "@/actions/tipos";
import { BotaoConfirmar } from "@/components/app/botao-confirmar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Resultado } from "@/lib/resultado";

type TipoLinhaProps = {
  id: string;
  nome: string;
  quantidadeMateriais: number;
};

export function TipoLinha({ id, nome, quantidadeMateriais }: TipoLinhaProps) {
  // useState: um pedacinho de memória do componente. Mudou → o React redesenha.
  const [editando, setEditando] = useState(false);

  // Em vez de passar a Server Action direto, passamos uma função nossa que chama a action
  // e já reage à resposta (aviso + fechar a edição). Reagir a um EVENTO acontece no
  // código do evento, não num useEffect.
  const [estado, acao, pendente] = useActionState(
    async (anterior: Resultado | null, formData: FormData) => {
      const resultado = await renomearTipoAction(id, anterior, formData);
      if (resultado.ok) {
        toast.success(resultado.mensagem);
        setEditando(false);
      } else {
        toast.error(resultado.campos?.nome?.[0] ?? resultado.erro);
      }
      return resultado;
    },
    null,
  );

  if (editando) {
    return (
      <li className="flex items-center gap-2 px-4 py-2">
        <form action={acao} className="flex flex-1 items-center gap-2">
          <Input
            key={JSON.stringify(estado)}
            name="nome"
            defaultValue={estado && !estado.ok ? estado.valores?.nome : nome}
            aria-label="Novo nome do tipo"
            autoFocus
            disabled={pendente}
            className="max-w-sm"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={pendente}
            aria-label="Salvar"
          >
            <Check />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setEditando(false)}
            aria-label="Cancelar"
          >
            <X />
          </Button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 px-4 py-3">
      <div className="flex-1">
        <div className="font-medium">{nome}</div>
        <div className="text-muted-foreground text-sm">
          {quantidadeMateriais === 0
            ? "Nenhum material"
            : `${quantidadeMateriais} ${quantidadeMateriais === 1 ? "material" : "materiais"}`}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setEditando(true)}
        aria-label={`Renomear ${nome}`}
      >
        <Pencil />
      </Button>
      <BotaoConfirmar
        acao={excluirTipoAction.bind(null, id)}
        titulo={`Excluir "${nome}"?`}
        descricao={
          quantidadeMateriais > 0
            ? `Este tipo tem ${quantidadeMateriais} material(is) e não pode ser excluído. Mude o tipo deles antes.`
            : "Esta ação não pode ser desfeita."
        }
        rotulo="Excluir"
        bloqueado={quantidadeMateriais > 0}
        variante="outline"
        tamanho="sm"
      />
    </li>
  );
}
