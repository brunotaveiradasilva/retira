# Fase 3 · Cadastros (Server Actions + Zod + React Hook Form)

Agora o sistema **grava**: tipos, materiais e colaboradores podem ser criados, editados e excluídos, com as regras de negócio valendo.

| Tela                                                | O que dá pra fazer                                          |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `/tipos` (novo no menu)                             | criar, renomear e excluir tipos                             |
| `/materiais/novo`, `/materiais/[id]/editar`         | cadastrar e editar material; excluir no detalhe             |
| `/colaboradores/novo`, `/colaboradores/[id]/editar` | cadastrar e editar; desativar/reativar e excluir no detalhe |

> Testou e bagunçou os dados? `npm run db:seed` volta tudo ao exemplo.

## O caminho de um cadastro

```
Formulário (navegador)                 Servidor
──────────────────────                 ────────────────────────────────────────────
React Hook Form + Zod   ──── POST ───▶ Server Action          Service           Banco
 valida na hora                         1. valida de novo      2. regras         3. grava
 (src/schemas)                             (mesmo schema)         (src/services)    (Prisma)
                        ◀── Resultado ─ { ok, mensagem }  ou  { ok: false, erro, campos }
toast + navega / mostra erro no campo
```

Cada pasta tem um papel:

| Pasta                         | Papel                                                                                                      | Pode usar         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------- |
| `src/schemas/`                | **Como o dado tem que ser** (Zod). Roda no navegador e no servidor.                                        | só Zod            |
| `src/services/`               | **Regras de negócio** + gravação. Recebem `empresaId` e dado já validado; lançam `RegraDeNegocioError`.    | Prisma            |
| `src/actions/`                | **Ponte** (`"use server"`): valida → descobre a empresa → chama o service → devolve `Resultado`. Fininhas. | schemas, services |
| `src/components/*/…-form.tsx` | **Formulário** (`"use client"`): mostra campos e erros, chama a action.                                    | React, RHF        |

Os services são a camada que vira a API em Java na fase 8: mesmas funções, mesmas regras, outra linguagem.

## Conceitos

### 1. Zod — `src/schemas/`

```ts
export const materialSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome"),
  codigo: textoOpcional(30),            // "" → null
  controle: z.enum(Controle),            // o enum que o Prisma gerou
  quantidade: z.number().int().min(1),
  ...
}).refine((d) => d.controle === "QUANTIDADE" || d.quantidade === 1, {
  path: ["quantidade"], message: "Material unitário tem sempre quantidade 1",
});
```

- `.trim()`, `.transform()`: o schema **limpa** o dado, não só confere.
- `.refine()`: regra que envolve mais de um campo.
- `z.input<typeof s>` (o que o formulário preenche) × `z.output<typeof s>` (o que sai validado).
- `src/schemas/zod.ts` põe as mensagens padrão em português (`z.config(z.locales.pt())`).

**A pegadinha que apareceu:** o schema roda **duas vezes** (navegador e servidor). No navegador `""` vira `null`; esse `null` vai pro servidor e passa pelo schema de novo. Se o schema só aceitasse texto, o servidor recusava. Por isso `textoOpcional` aceita `string | null` (`.nullish()`).

### 2. Server Actions — `src/actions/`

`"use server"` no topo: cada função exportada pode ser chamada pelo navegador (vira um POST), mas roda no servidor. Por isso:

- **Nunca confie nos argumentos.** `dados: unknown` e `safeParse` antes de tudo. Qualquer um pode chamar a action com qualquer coisa, sem passar pelo seu formulário.
- **Sempre confira o dono.** Os services fazem `garantir…DaEmpresa(empresaId, id)`: um id de outra empresa não é encontrado.
- **Erro esperado ≠ erro inesperado.** `RegraDeNegocioError` vira mensagem pra pessoa; qualquer outro erro vira "Não foi possível salvar" e o detalhe fica no log (`src/lib/acao.ts`).

O terminal do `npm run dev` mostra cada action chamada e os argumentos — bom pra entender o que trafega.

### 3. `Resultado` — um _discriminated union_ (`src/lib/resultado.ts`)

```ts
type Resultado =
  | { ok: true; id?: string; mensagem?: string }
  | { ok: false; erro: string; campos?: Record<string, string[]> };
```

Depois de `if (!resultado.ok)`, o TypeScript sabe que existe `resultado.erro`. Sem `ok`, ele não deixa acessar. `Extract<Resultado, { ok: false }>` pega só o lado de erro (`Falha`).

### 4. Dois jeitos de formulário

**a) Simples — `<form action>` + `useActionState`** (`components/tipos/novo-tipo-form.tsx`)

- Os campos vão num `FormData` pelo atributo `name`. Funciona até sem JavaScript.
- `useActionState(fn, inicial)` → `[estado, acao, pendente]`.
- Validação só no servidor.
- **React 19 limpa o formulário depois do envio.** Se der erro, a pessoa perderia o que digitou — por isso a action devolve `valores` e o input usa `defaultValue` + `key`.

**b) Completo — React Hook Form + Zod** (`components/materiais/material-form.tsx`)

- `useForm({ resolver: zodResolver(schema) })`: valida no navegador com o mesmo schema, erro aparece na hora.
- `register("nome")` liga o input ao formulário; `{ valueAsNumber: true }` pra números.
- `useWatch` observa um campo (controle) e muda a tela (quantidade travada em 1).
- `handleSubmit(enviar)` só chama `enviar` se o Zod aprovar.
- Erros do **servidor** (código repetido) voltam com `campos` e viram `setError` no campo certo.
- `readOnly` e não `disabled`: campo desabilitado não é enviado.

### 5. Depois de salvar: atualizar a tela

| Situação                                    | O que fazemos                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| Continua na mesma página (tipos, desativar) | `refresh()` dentro da action: o Next redesenha a página com os dados novos    |
| Vai pra outra página (cadastrou/excluiu)    | a action devolve `{ ok, id }` e o formulário faz `router.push(...)` + `toast` |

Não usamos `revalidatePath`/`revalidateTag` porque ainda não cacheamos nada (fase 2: dado sempre fresco).

### 6. Server Component passando action pra Client Component

```tsx
// materiais/[id]/page.tsx (servidor)
<BotaoConfirmar acao={excluirMaterialAction.bind(null, material.id)} ... />
```

`.bind(null, id)` cria uma nova função com o primeiro argumento já preenchido. O `BotaoConfirmar` (cliente) só chama `acao()`, sem saber de ids.

### 7. Não use `useEffect` pra reagir a eventos

A primeira versão do formulário de tipos mostrava o toast num `useEffect` que olhava o `estado`. O lint reclamou (`set-state-in-effect`). O certo: reagir **no código do evento** — a função passada ao `useActionState` chama a action e já faz `toast`/`setEditando(false)`.

### 8. A tela ajuda, o servidor garante

O botão "Excluir" de um material com histórico mostra só a explicação (`bloqueado`). Mas a regra **mora no service**: mesmo chamando a action direto, o servidor recusa. Você viu isso ao tentar excluir o Carlos Lima.

## Regras implementadas (`src/services/`)

- Tipo: nome único por empresa; só exclui se não tiver materiais.
- Material: tipo precisa ser da empresa; código único por empresa; unitário = quantidade 1; quantidade não pode ficar abaixo do que está emprestado; só exclui se nunca foi emprestado (senão: estado **Baixado**).
- Colaborador: telefone com DDD; desativar avisa se ainda tem material; só exclui se não tiver histórico (senão: **Desativar**).

## Exercícios

1. **Ver a validação dupla**: no `material-form.tsx`, troque `resolver: zodResolver(materialSchema)` por nada (comente a linha), envie com nome vazio e veja o erro vir do servidor.
2. **Regra nova no Zod**: matrícula só com números (`.regex(/^\d*$/, "...")`). Note que vale nos dois lados sem mexer na action.
3. **Regra nova no service**: impedir dois colaboradores **ativos** com a mesma matrícula na empresa (`findFirst` antes de criar/atualizar → `RegraDeNegocioError(..., "matricula")`).
4. **Teste a regra de quantidade**: edite o Capacete (20 unidades, 4 emprestadas) e tente salvar com 2.
5. **Filtro na lista**: botão "Mostrar inativos" na lista de colaboradores usando `searchParams` (`/colaboradores?inativos=1`).
6. **Desafio**: na página de tipos, permitir arrastar materiais de um tipo pra outro antes de excluir… ou, mais simples, um select "mover os materiais para" no diálogo de exclusão.
