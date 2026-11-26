"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { criarTipoAction } from "@/actions/tipos";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Resultado } from "@/lib/resultado";

// O jeito mais simples de formulário no Next: <form action={serverAction}>.
// O navegador junta os campos num FormData (pelo atributo `name`) e manda pra action.
// Sem React Hook Form: a validação acontece só no servidor (Zod dentro da action).
export function NovoTipoForm() {
  // useActionState guarda o último Resultado da action e diz se ela está rodando.
  //   estado    → o que a action devolveu da última vez (null no começo)
  //   acao      → a função pra pôr no <form action>
  //   pendente  → true enquanto a action roda
  const [estado, acao, pendente] = useActionState(
    async (anterior: Resultado | null, formData: FormData) => {
      const resultado = await criarTipoAction(anterior, formData);
      // O aviso sai aqui, junto da resposta (e não num useEffect olhando o estado).
      // Limpar o campo não precisa: o React 19 já limpa o <form action> depois do envio.
      if (resultado.ok) toast.success(resultado.mensagem);
      return resultado;
    },
    null,
  );

  const erroDoNome = estado && !estado.ok ? estado.campos?.nome : undefined;
  // Se deu erro, o que a pessoa digitou volta pro campo (o React limpou o form ao enviar).
  const nomeDigitado = estado && !estado.ok ? estado.valores?.nome : "";

  return (
    <form action={acao} className="flex items-start gap-2">
      <Field data-invalid={!!erroDoNome} className="max-w-sm">
        <FieldLabel htmlFor="novo-tipo" className="sr-only">
          Nome do tipo
        </FieldLabel>
        <Input
          // key muda a cada resposta → o React recria o input com o defaultValue novo
          key={JSON.stringify(estado)}
          defaultValue={nomeDigitado}
          id="novo-tipo"
          name="nome"
          placeholder="Ex.: Ferramentas elétricas"
          aria-invalid={!!erroDoNome}
          disabled={pendente}
          required
        />
        <FieldError errors={erroDoNome?.map((message) => ({ message }))} />
      </Field>
      <Button type="submit" disabled={pendente}>
        <Plus aria-hidden="true" />
        {pendente ? "Salvando..." : "Adicionar"}
      </Button>
    </form>
  );
}
