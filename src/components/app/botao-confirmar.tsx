"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Resultado } from "@/lib/resultado";

type BotaoConfirmarProps = {
  /** A Server Action a executar (normalmente com o id já amarrado via .bind). */
  acao: () => Promise<Resultado>;
  titulo: string;
  descricao: ReactNode;
  /** Texto do botão que abre a caixa e do botão de confirmar. */
  rotulo: string;
  /** Pra onde ir depois de dar certo (ex.: a lista, depois de excluir). */
  irPara?: string;
  variante?: "destructive" | "outline";
  tamanho?: "default" | "sm";
  /** A tela já sabe que a regra não deixa: mostra só a explicação, sem botão de confirmar. */
  bloqueado?: boolean;
  /** Confirmar em vermelho (excluir) ou na cor principal (desativar, reativar). */
  destrutivo?: boolean;
};

/** Botão que pede confirmação antes de rodar uma ação (excluir, por exemplo). */
export function BotaoConfirmar({
  acao,
  titulo,
  descricao,
  rotulo,
  irPara,
  variante = "destructive",
  tamanho = "default",
  bloqueado = false,
  destrutivo = true,
}: BotaoConfirmarProps) {
  const [aberto, setAberto] = useState(false);
  // useTransition: `pendente` fica true enquanto a action roda (pra desabilitar o botão).
  const [pendente, iniciarTransicao] = useTransition();
  const router = useRouter();

  function confirmar() {
    iniciarTransicao(async () => {
      const resultado = await acao();
      if (!resultado.ok) {
        toast.error(resultado.erro);
        setAberto(false);
        return;
      }
      toast.success(resultado.mensagem ?? "Pronto.");
      setAberto(false);
      if (irPara) router.push(irPara);
    });
  }

  return (
    <AlertDialog open={aberto} onOpenChange={setAberto}>
      {/* render: o gatilho do diálogo é desenhado como o nosso Button */}
      <AlertDialogTrigger render={<Button variant={variante} size={tamanho} />}>
        {rotulo}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pendente}>
            {bloqueado ? "Entendi" : "Cancelar"}
          </AlertDialogCancel>
          {/* Mesmo escondendo o botão, a regra continua no servidor (no service):
              a tela só evita um clique inútil, quem garante é o backend. */}
          {!bloqueado && (
            <Button
              variant={destrutivo ? "destructive" : "default"}
              onClick={confirmar}
              disabled={pendente}
            >
              {pendente ? "Aguarde..." : rotulo}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
