"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { entrarAction } from "@/actions/autenticacao";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Campo } from "./campo";

export function LoginForm() {
  const [estado, acao, pendente] = useActionState(entrarAction, null);
  // /login?de=/materiais → depois de entrar, volta pra /materiais
  const de = useSearchParams().get("de") ?? "";

  // Erro geral (ex.: senha errada) que não é de um campo específico.
  const erroGeral = estado && !estado.ok && !estado.campos ? estado.erro : null;

  return (
    <form action={acao}>
      <input type="hidden" name="de" value={de} />
      <FieldGroup>
        {erroGeral && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
          >
            {erroGeral}
          </p>
        )}
        <Campo
          nome="email"
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          estado={estado}
          required
          autoFocus
        />
        <Campo
          nome="senha"
          rotulo="Senha"
          type="password"
          autoComplete="current-password"
          estado={estado}
          required
        />
        <Button type="submit" disabled={pendente} className="w-full">
          {pendente ? "Entrando..." : "Entrar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
