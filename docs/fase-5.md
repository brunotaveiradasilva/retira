# Fase 5 · Empréstimos (retirada, devolução e termo)

O coração do Retira: registrar **o que saiu, com quem e até quando** — e o que voltou.

| Tela                                                                         | O que faz                                                                     |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `/emprestimos/novo` (botão "Nova retirada", também na página do colaborador) | escolhe quem retira, adiciona vários itens com quantidade, prazo e observação |
| `/emprestimos/[id]` (clique no status em qualquer lista)                     | detalhe; marca o que está voltando (tudo ou parte) e o que voltou danificado  |
| `/emprestimos/[id]/termo`                                                    | termo de responsabilidade pronto pra imprimir e assinar                       |

## Regras (`src/services/emprestimos.service.ts`)

**Retirada**

- Colaborador da empresa e **ativo**.
- Material da empresa e em estado **Bom**.
- Unitário sai **1 por vez**.
- Não sai mais do que está **disponível** (total − o que está fora).
- Prazo não pode ser no passado; vale até o **fim do dia** escolhido.

**Devolução**

- Pode ser **parcial**: os itens marcados ganham `devolvidoEm`; o empréstimo fica `PARCIAL`. Quando volta o último, `DEVOLVIDO`.
- Unitário que **voltou danificado** → o material vira `DANIFICADO` e sai da lista de disponíveis.

## Conceitos

### 1. Transação interativa — `prisma.$transaction(async (tx) => { ... })`

Retirada mexe em várias tabelas. Tudo que usa `tx` dentro da função faz parte da mesma transação: se qualquer regra lançar erro no meio, **nada** é gravado (nem o empréstimo, nem os itens).

### 2. Concorrência: `SELECT ... FOR UPDATE`

Duas pessoas clicam "Registrar" ao mesmo tempo pedindo a última trena. As duas leem "1 disponível", as duas passam na regra, e saem 2 trenas de 1. A solução:

```ts
await tx.$queryRaw`SELECT id FROM materiais WHERE id IN (${Prisma.join(ids)}) FOR UPDATE`;
```

`FOR UPDATE` **trava** essas linhas até a transação terminar: a segunda retirada espera a primeira e, quando lê, já vê 0 disponível. É SQL "cru" (`$queryRaw`) porque o Prisma não tem isso no `findMany`. O template com crase escapa os valores — **nunca** monte SQL concatenando texto.

### 3. Lista dinâmica — `useFieldArray` (`components/emprestimos/retirada-form.tsx`)

```ts
const { fields, append, remove } = useFieldArray({ control, name: "itens" });
```

- `fields.map(...)` desenha as linhas; `register(\`itens.${indice}.quantidade\`)` liga cada campo.
- `key={linha.id}` — o id que o `useFieldArray` criou. **Não use o índice**: removendo uma linha do meio, os índices mudam e o React troca os valores de lugar.
- Uma linha não oferece o material já escolhido em outra; o schema também recusa repetidos (`refine` com `Set`).
- `z.array(itemSchema).min(1)` — lista com pelo menos um item.

### 4. A pegadinha do `validate` com resolver

A primeira versão conferia o disponível com `register(..., { validate })`. Não funcionou: **com `resolver`, o React Hook Form ignora as regras do `register`**. O servidor barrou (ainda bem!), mas o erro deveria aparecer antes.

A solução foi estender o schema **na tela**, que conhece os números:

```ts
const schemaDaTela = useMemo(
  () =>
    retiradaSchema.superRefine((dados, contexto) => {
      /* confere cada linha */
    }),
  [materiais],
);
```

`superRefine` + `addIssue({ path: ["itens", indice, "quantidade"] })` coloca o erro na linha exata. O servidor confere de novo, com o número atualizado do banco.

### 5. `key` para zerar o estado de um componente

Depois de uma devolução parcial, o `refresh()` redesenha a página, mas o `DevolucaoFormulario` **mantinha** as caixinhas antigas (com ids de itens que já voltaram). O componente é o mesmo, então o React preserva o `useState`. A correção:

```tsx
<DevolucaoFormulario key={pendentes.map((i) => i.id).join(",")} ... />
```

Mudou a lista → mudou a `key` → o React descarta o componente velho e cria outro, com estado novo.

### 6. Estado imutável com `Set`

```ts
setVoltando((atual) => {
  const novo = new Set(atual);
  novo.delete(id);
  return novo;
});
```

Sempre um **novo** `Set`. Se mudássemos o mesmo objeto, o React compararia "é o mesmo" e não redesenharia.

### 7. `searchParams` e datas sem _hydration error_

- `/emprestimos/novo?colaborador=<id>` já abre com o colaborador escolhido. `searchParams` é Promise (como `params`), e o valor só é aceito se estiver na lista de colaboradores da empresa.
- O prazo sugerido (+7 dias) é calculado **no servidor** e vai pronto por prop. Se o navegador calculasse `new Date()`, o HTML do servidor e o do navegador poderiam ter datas diferentes → erro de _hydration_.

### 8. Página para imprimir — classes `print:`

`print:hidden` some no papel (menu, botões), `print:p-0` tira espaçamentos. O layout `(app)` esconde a barra lateral na impressão. `window.print()` só existe no navegador, por isso o `BotaoImprimir` é Client Component.

### 9. Route Handler — `src/app/sessao-expirada/route.ts`

Bug achado nesta fase: depois de um `db:seed` (que apaga as sessões), o navegador ficava em **loop** entre `/painel` e `/login`. O cookie velho fazia o proxy achar que havia login, e o servidor, sem sessão, mandava pro login.

Server Components não podem apagar cookies. Um **Route Handler** (`route.ts`, uma URL que responde com código, sem página) pode:

```
página sem sessão válida → redirect("/sessao-expirada") → apaga o cookie → /login
```

## Exercícios

1. **Ver a transação**: em `registrarRetirada`, lance um `throw new Error("teste")` logo depois do `tx.emprestimo.create`. Tente uma retirada e confirme no Prisma Studio que nenhum empréstimo foi criado.
2. **Botão "Devolver tudo"** na lista de empréstimos abertos (sem abrir o detalhe), reusando `registrarDevolucaoAction`.
3. **Desfazer dano**: no detalhe do material danificado, um botão "Voltou do conserto" que muda o estado pra Bom.
4. **Painel**: transforme cada atrasado em link pro detalhe e mostre "há X dias" de atraso.
5. **Histórico da devolução**: adicione `devolvidoDanificado Boolean @default(false)` em `ItemEmprestimo` (migration!), grave no service e mostre um selo "voltou danificado" nos devolvidos.
6. **Desafio — testar a concorrência**: um script com `tsx` que chama o service duas vezes ao mesmo tempo (`Promise.all`) pedindo a última unidade de um material. Com o `FOR UPDATE`, uma deve falhar. Comente a linha e veja as duas passarem.
