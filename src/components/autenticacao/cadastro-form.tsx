"use client";

import { useActionState } from "react";
import { cadastrarAction } from "@/actions/autenticacao";
import { Button } from "@/components/ui/button";
import {
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Campo } from "./campo";

export function CadastroForm() {
  const [estado, acao, pendente] = useActionState(cadastrarAction, null);
  const erroGeral = estado && !estado.ok && !estado.campos ? estado.erro : null;

  return (
    <form action={acao}>
      <FieldGroup>
        {erroGeral && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm"
          >
            {erroGeral}
          </p>
        )}

        <FieldSet>
          <FieldLegend>Empresa</FieldLegend>
          <FieldGroup>
            <Campo
              nome="empresaNome"
              rotulo="Nome da empresa"
              autoComplete="organization"
              estado={estado}
              required
              autoFocus
            />
            <Campo
              nome="cnpj"
              rotulo="CNPJ (opcional)"
              inputMode="numeric"
              estado={estado}
            />
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Seu acesso</FieldLegend>
          <FieldGroup>
            <Campo
              nome="nome"
              rotulo="Seu nome"
              autoComplete="name"
              estado={estado}
              required
            />
            <Campo
              nome="email"
              rotulo="E-mail"
              type="email"
              autoComplete="email"
              estado={estado}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                nome="senha"
                rotulo="Senha"
                type="password"
                autoComplete="new-password"
                estado={estado}
                required
              />
              <Campo
                nome="confirmacao"
                rotulo="Repita a senha"
                type="password"
                autoComplete="new-password"
                estado={estado}
                required
              />
            </div>
          </FieldGroup>
        </FieldSet>

        <Button type="submit" disabled={pendente} className="w-full">
          {pendente ? "Criando..." : "Criar conta"}
        </Button>
      </FieldGroup>
    </form>
  );
}
