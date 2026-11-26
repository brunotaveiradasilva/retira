"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { salvarColaboradorAction } from "@/actions/colaboradores";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  colaboradorSchema,
  type ColaboradorForm,
  type ColaboradorInput,
} from "@/schemas/colaborador";

type ColaboradorFormProps = {
  colaboradorId: string | null;
  valoresIniciais?: ColaboradorForm;
};

// Mesmo padrão do formulário de material, com menos campos.
// Compare os dois: a estrutura se repete (useForm → register → handleSubmit → action).
export function ColaboradorFormulario({
  colaboradorId,
  valoresIniciais,
}: ColaboradorFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ColaboradorForm, unknown, ColaboradorInput>({
    resolver: zodResolver(colaboradorSchema),
    defaultValues: valoresIniciais ?? {
      nome: "",
      matricula: "",
      setor: "",
      telefone: "",
    },
  });

  async function enviar(dados: ColaboradorInput) {
    const resultado = await salvarColaboradorAction(colaboradorId, dados);
    if (!resultado.ok) {
      for (const [campo, mensagens] of Object.entries(resultado.campos ?? {})) {
        setError(campo as keyof ColaboradorForm, { message: mensagens?.[0] });
      }
      toast.error(resultado.erro);
      return;
    }
    toast.success(resultado.mensagem);
    router.push(`/colaboradores/${resultado.id}`);
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="max-w-xl">
      <FieldGroup>
        <Field data-invalid={!!errors.nome}>
          <FieldLabel htmlFor="nome">Nome completo</FieldLabel>
          <Input
            id="nome"
            {...register("nome")}
            aria-invalid={!!errors.nome}
            autoFocus
          />
          <FieldError errors={[errors.nome]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.matricula}>
            <FieldLabel htmlFor="matricula">Matrícula</FieldLabel>
            <Input
              id="matricula"
              {...register("matricula")}
              aria-invalid={!!errors.matricula}
              placeholder="Opcional"
            />
            <FieldError errors={[errors.matricula]} />
          </Field>

          <Field data-invalid={!!errors.setor}>
            <FieldLabel htmlFor="setor">Setor</FieldLabel>
            <Input
              id="setor"
              {...register("setor")}
              aria-invalid={!!errors.setor}
              placeholder="Ex.: Obras, Manutenção"
            />
            <FieldError errors={[errors.setor]} />
          </Field>
        </div>

        <Field data-invalid={!!errors.telefone}>
          <FieldLabel htmlFor="telefone">Telefone</FieldLabel>
          <Input
            id="telefone"
            type="tel"
            inputMode="tel"
            {...register("telefone")}
            aria-invalid={!!errors.telefone}
            placeholder="(51) 99999-9999"
            className="sm:w-64"
          />
          <FieldError errors={[errors.telefone]} />
        </Field>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Salvando..."
              : colaboradorId
                ? "Salvar alterações"
                : "Cadastrar colaborador"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
