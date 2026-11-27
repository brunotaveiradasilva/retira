"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { salvarMaterialAction } from "@/actions/materiais";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { nomeDoEstado } from "@/lib/formatar";
import {
  materialSchema,
  type MaterialForm,
  type MaterialInput,
} from "@/schemas/material";
import type { EstadoMaterial } from "@/types";

type MaterialFormProps = {
  /** null = cadastrar; um id = editar esse material */
  materialId: string | null;
  valoresIniciais?: MaterialForm;
};

const estados = Object.keys(nomeDoEstado) as EstadoMaterial[];

export function MaterialFormulario({
  materialId,
  valoresIniciais,
}: MaterialFormProps) {
  const router = useRouter();

  // useForm: o React Hook Form cuida dos valores, erros e envio.
  // zodResolver(materialSchema): valida com o MESMO schema que a action usa no servidor.
  // Os genéricos dizem: o formulário trabalha com MaterialForm (entrada do Zod)
  // e, depois de validado, entrega MaterialInput (saída do Zod, com codigo null).
  const form = useForm<MaterialForm, unknown, MaterialInput>({
    resolver: zodResolver(materialSchema),
    defaultValues: valoresIniciais ?? {
      nome: "",
      codigo: "",
      controle: "UNITARIO",
      quantidade: 1,
      estado: "BOM",
    },
  });
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  // useWatch: "fica olhando" um campo. Muda o controle → o componente redesenha.
  const controle = useWatch({ control: form.control, name: "controle" });

  // Unitário tem sempre quantidade 1: ao trocar pra unitário, ajusta o campo.
  useEffect(() => {
    if (controle === "UNITARIO") setValue("quantidade", 1);
  }, [controle, setValue]);

  // Só chega aqui se o Zod aprovou no navegador. `dados` já está limpo e tipado.
  async function enviar(dados: unknown) {
    const resultado = await salvarMaterialAction(materialId, dados);

    if (!resultado.ok) {
      // Erros que o SERVIDOR achou (ex.: código repetido) vão pro campo certo.
      for (const [campo, mensagens] of Object.entries(resultado.campos ?? {})) {
        setError(campo as keyof MaterialForm, { message: mensagens?.[0] });
      }
      toast.error(resultado.erro);
      return;
    }

    toast.success(resultado.mensagem);
    router.push(`/materiais/${resultado.id}`);
  }

  return (
    // handleSubmit valida antes; se tiver erro, nem chama `enviar`.
    <form onSubmit={handleSubmit(enviar)} noValidate className="max-w-xl">
      <FieldGroup>
        <Field data-invalid={!!errors.nome}>
          <FieldLabel htmlFor="nome">Nome</FieldLabel>
          {/* register("nome") liga o input ao formulário (name, onChange, onBlur, ref) */}
          <Input
            id="nome"
            {...register("nome")}
            aria-invalid={!!errors.nome}
            autoFocus
          />
          <FieldError errors={[errors.nome]} />
        </Field>

        <Field data-invalid={!!errors.codigo}>
          <FieldLabel htmlFor="codigo">Patrimônio</FieldLabel>
          <Input
            id="codigo"
            {...register("codigo")}
            aria-invalid={!!errors.codigo}
            placeholder="Opcional"
            className="sm:w-64"
          />
          <FieldError errors={[errors.codigo]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="controle">Controle</FieldLabel>
            <NativeSelect
              id="controle"
              {...register("controle")}
              className="w-full"
            >
              <NativeSelectOption value="UNITARIO">
                Unitário (cada um tem identidade)
              </NativeSelectOption>
              <NativeSelectOption value="QUANTIDADE">
                Por quantidade (itens iguais)
              </NativeSelectOption>
            </NativeSelect>
          </Field>

          <Field data-invalid={!!errors.quantidade}>
            <FieldLabel htmlFor="quantidade">Quantidade</FieldLabel>
            <Input
              id="quantidade"
              type="number"
              min={1}
              // valueAsNumber: o input devolve número, não texto ("3" → 3)
              {...register("quantidade", { valueAsNumber: true })}
              // readOnly e não disabled: campo disabled é ignorado no envio do formulário
              readOnly={controle === "UNITARIO"}
              className={controle === "UNITARIO" ? "bg-muted" : undefined}
              aria-invalid={!!errors.quantidade}
            />
            {controle === "UNITARIO" && (
              <FieldDescription>Unitário é sempre 1.</FieldDescription>
            )}
            <FieldError errors={[errors.quantidade]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="estado">Estado</FieldLabel>
          <NativeSelect
            id="estado"
            {...register("estado")}
            className="w-full sm:w-64"
          >
            {estados.map((estado) => (
              <NativeSelectOption key={estado} value={estado}>
                {nomeDoEstado[estado]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>
            Só materiais em estado Bom podem ser emprestados.
          </FieldDescription>
        </Field>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Salvando..."
              : materialId
                ? "Salvar alterações"
                : "Cadastrar material"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
