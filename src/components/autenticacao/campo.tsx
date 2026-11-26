"use client";

import type { ComponentProps } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { Resultado } from "@/lib/resultado";

type CampoProps = Omit<
  ComponentProps<typeof Input>,
  "name" | "defaultValue"
> & {
  nome: string;
  rotulo: string;
  /** O último Resultado da action: daqui saem o erro e o valor digitado. */
  estado: Resultado | null;
};

/**
 * Um campo de formulário "à moda <form action>": rótulo + input + erro do servidor.
 * Os formulários de login e cadastro têm vários campos iguais; em vez de repetir
 * 10 linhas por campo, um componente.
 */
export function Campo({ nome, rotulo, estado, ...props }: CampoProps) {
  const erros = estado && !estado.ok ? estado.campos?.[nome] : undefined;
  const valor = estado && !estado.ok ? estado.valores?.[nome] : undefined;

  return (
    <Field data-invalid={!!erros}>
      <FieldLabel htmlFor={nome}>{rotulo}</FieldLabel>
      <Input
        id={nome}
        name={nome}
        // key: quando chega uma resposta nova, recria o input com o valor devolvido
        key={JSON.stringify(estado)}
        defaultValue={valor}
        aria-invalid={!!erros}
        {...props}
      />
      <FieldError errors={erros?.map((message) => ({ message }))} />
    </Field>
  );
}
