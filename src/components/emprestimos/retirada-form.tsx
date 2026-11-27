"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { registrarRetiradaAction } from "@/actions/emprestimos";
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
import { Textarea } from "@/components/ui/textarea";
import type { OpcoesDeRetirada } from "@/lib/consultas";
import {
  retiradaSchema,
  type RetiradaForm,
  type RetiradaInput,
} from "@/schemas/emprestimo";

type RetiradaFormProps = OpcoesDeRetirada & {
  /** Hoje ("2026-11-27") e a devolução sugerida, calculados no servidor (fuso de Brasília). */
  hoje: string;
  prazoSugerido: string;
  /** Colaborador já escolhido (quando vem da página dele). */
  colaboradorInicial?: string;
};

export function RetiradaFormulario({
  colaboradores,
  materiais,
  hoje,
  prazoSugerido,
  colaboradorInicial,
}: RetiradaFormProps) {
  const router = useRouter();

  // O schema compartilhado não sabe quantas unidades há livres (isso vem do banco).
  // Aqui na tela nós sabemos: então "estendemos" o schema com um superRefine que confere
  // cada linha. (Com resolver, as regras `validate` do register são IGNORADAS pelo
  // React Hook Form; por isso a checagem tem que morar no schema.)
  // useMemo: monta o schema uma vez só, e não a cada redesenho.
  const schemaDaTela = useMemo(
    () =>
      retiradaSchema.superRefine((dados, contexto) => {
        dados.itens.forEach((item, indice) => {
          const material = materiais.find((m) => m.id === item.materialId);
          if (material && item.quantidade > material.disponivel) {
            contexto.addIssue({
              code: "custom",
              path: ["itens", indice, "quantidade"],
              message: `Só ${material.disponivel} disp.`,
            });
          }
        });
      }),
    [materiais],
  );

  const form = useForm<RetiradaForm, unknown, RetiradaInput>({
    resolver: zodResolver(schemaDaTela),
    defaultValues: {
      colaboradorId: colaboradorInicial ?? "",
      retiradoEm: hoje,
      previsaoDevolucao: prazoSugerido,
      dataEvento: "",
      localEvento: "",
      enderecoEvento: "",
      observacao: "",
      itens: [{ materialId: "", quantidade: 1 }],
    },
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  // useFieldArray: uma LISTA de grupos de campos que cresce e diminui.
  //   fields  → as linhas atuais (cada uma com um `id` próprio pra usar como key)
  //   append  → adiciona uma linha    remove(i) → tira a linha i
  const { fields, append, remove } = useFieldArray({ control, name: "itens" });

  // Os itens escolhidos até agora (pra mostrar "disponível" e travar duplicados).
  const itens = useWatch({ control, name: "itens" });

  const buscarMaterial = (id: string) => materiais.find((m) => m.id === id);

  async function enviar(dados: RetiradaInput) {
    const resultado = await registrarRetiradaAction(dados);
    if (!resultado.ok) {
      for (const [campo, mensagens] of Object.entries(resultado.campos ?? {})) {
        // "itens" não é um campo de texto: o erro vai pra "raiz" da lista.
        const destino = campo === "itens" ? "itens.root" : campo;
        setError(destino as "colaboradorId", { message: mensagens?.[0] });
      }
      toast.error(resultado.erro);
      return;
    }
    toast.success(resultado.mensagem);
    router.push(`/emprestimos/${resultado.id}`);
  }

  if (colaboradores.length === 0 || materiais.length === 0) {
    return (
      <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
        {colaboradores.length === 0
          ? "Cadastre um colaborador ativo antes de registrar uma retirada."
          : "Nenhum material disponível agora."}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate className="max-w-2xl">
      <FieldGroup>
        <Field data-invalid={!!errors.colaboradorId}>
          <FieldLabel htmlFor="colaboradorId">Quem está retirando</FieldLabel>
          <NativeSelect
            id="colaboradorId"
            {...register("colaboradorId")}
            aria-invalid={!!errors.colaboradorId}
            className="w-full"
          >
            <NativeSelectOption value="">Escolha...</NativeSelectOption>
            {colaboradores.map((colaborador) => (
              <NativeSelectOption key={colaborador.id} value={colaborador.id}>
                {colaborador.nome}
                {colaborador.setor ? ` · ${colaborador.setor}` : ""}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldError errors={[errors.colaboradorId]} />
        </Field>

        {/* As três datas lado a lado, na ordem em que acontecem. */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field data-invalid={!!errors.retiradoEm}>
            <FieldLabel htmlFor="retiradoEm">Retirada</FieldLabel>
            <Input
              id="retiradoEm"
              type="date"
              {...register("retiradoEm")}
              aria-invalid={!!errors.retiradoEm}
            />
            <FieldError errors={[errors.retiradoEm]} />
          </Field>

          <Field data-invalid={!!errors.dataEvento}>
            <FieldLabel htmlFor="dataEvento">Evento (opcional)</FieldLabel>
            <Input
              id="dataEvento"
              type="date"
              {...register("dataEvento")}
              aria-invalid={!!errors.dataEvento}
            />
            <FieldError errors={[errors.dataEvento]} />
          </Field>

          <Field data-invalid={!!errors.previsaoDevolucao}>
            <FieldLabel htmlFor="previsaoDevolucao">Devolução</FieldLabel>
            <Input
              id="previsaoDevolucao"
              type="date"
              {...register("previsaoDevolucao")}
              aria-invalid={!!errors.previsaoDevolucao}
            />
            <FieldError errors={[errors.previsaoDevolucao]} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[2fr_3fr]">
          <Field data-invalid={!!errors.localEvento}>
            <FieldLabel htmlFor="localEvento">Local do evento</FieldLabel>
            <Input
              id="localEvento"
              {...register("localEvento")}
              aria-invalid={!!errors.localEvento}
              placeholder="Ex.: Pavilhão da Expointer"
            />
            <FieldError errors={[errors.localEvento]} />
          </Field>

          <Field data-invalid={!!errors.enderecoEvento}>
            <FieldLabel htmlFor="enderecoEvento">Endereço</FieldLabel>
            <Input
              id="enderecoEvento"
              {...register("enderecoEvento")}
              aria-invalid={!!errors.enderecoEvento}
              placeholder="Rua, número, bairro, cidade"
            />
            <FieldError errors={[errors.enderecoEvento]} />
          </Field>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-medium">Itens</legend>

          {fields.map((linha, indice) => {
            const escolhido = buscarMaterial(itens?.[indice]?.materialId ?? "");
            const unitario = escolhido?.controle === "UNITARIO";
            const erroDaLinha = errors.itens?.[indice];
            // Materiais já usados em OUTRAS linhas não aparecem de novo.
            const usadosEmOutrasLinhas = new Set(
              (itens ?? [])
                .filter((_, i) => i !== indice)
                .map((item) => item.materialId),
            );

            return (
              // key={linha.id}: o id que o useFieldArray criou. NÃO use o índice:
              // ao remover uma linha do meio, os índices mudam e o React confunde os campos.
              <div
                key={linha.id}
                className="grid grid-cols-[1fr_6rem_auto] items-start gap-2"
              >
                <Field data-invalid={!!erroDaLinha?.materialId}>
                  <FieldLabel
                    htmlFor={`itens.${indice}.materialId`}
                    className="sr-only"
                  >
                    Material {indice + 1}
                  </FieldLabel>
                  <NativeSelect
                    id={`itens.${indice}.materialId`}
                    {...register(`itens.${indice}.materialId`, {
                      // Unitário: ao trocar o material, a quantidade volta pra 1.
                      onChange: () =>
                        form.setValue(`itens.${indice}.quantidade`, 1),
                    })}
                    aria-invalid={!!erroDaLinha?.materialId}
                    className="w-full"
                  >
                    <NativeSelectOption value="">
                      Escolha o material...
                    </NativeSelectOption>
                    {materiais
                      .filter((m) => !usadosEmOutrasLinhas.has(m.id))
                      .map((material) => (
                        <NativeSelectOption
                          key={material.id}
                          value={material.id}
                        >
                          {material.nome}
                          {material.codigo
                            ? ` (${material.codigo})`
                            : ""} · {material.disponivel} disp.
                        </NativeSelectOption>
                      ))}
                  </NativeSelect>
                  <FieldError errors={[erroDaLinha?.materialId]} />
                </Field>

                <Field data-invalid={!!erroDaLinha?.quantidade}>
                  <FieldLabel
                    htmlFor={`itens.${indice}.quantidade`}
                    className="sr-only"
                  >
                    Quantidade {indice + 1}
                  </FieldLabel>
                  <Input
                    id={`itens.${indice}.quantidade`}
                    type="number"
                    min={1}
                    max={escolhido?.disponivel}
                    readOnly={unitario}
                    className={unitario ? "bg-muted" : undefined}
                    {...register(`itens.${indice}.quantidade`, {
                      valueAsNumber: true,
                    })}
                    aria-invalid={!!erroDaLinha?.quantidade}
                  />
                  <FieldError errors={[erroDaLinha?.quantidade]} />
                </Field>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(indice)}
                  disabled={fields.length === 1}
                  aria-label={`Remover item ${indice + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>
            );
          })}

          {/* Erro da lista inteira (vazia, repetido, ou vindo do servidor) */}
          {/* Erro da lista inteira (vazia, repetido, ou vindo do servidor).
              Pode chegar em itens.root (setError) ou em itens (refine do Zod). */}
          <FieldError errors={[errors.itens?.root ?? errors.itens]} />

          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ materialId: "", quantidade: 1 })}
              disabled={fields.length >= materiais.length}
            >
              <Plus /> Adicionar item
            </Button>
          </div>
        </fieldset>

        <Field data-invalid={!!errors.observacao}>
          <FieldLabel htmlFor="observacao">Observação</FieldLabel>
          <Textarea
            id="observacao"
            rows={2}
            placeholder="Opcional. Ex.: obra da Rua Independência"
            {...register("observacao")}
          />
          <FieldDescription>
            Aparece no termo de responsabilidade.
          </FieldDescription>
          <FieldError errors={[errors.observacao]} />
        </Field>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Registrando..." : "Registrar retirada"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
