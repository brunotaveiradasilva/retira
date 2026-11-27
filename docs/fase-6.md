# Fase 6 · Painel, busca, filtros e paginação

O sistema fica bom de usar no dia a dia: achar as coisas rápido e ver o que precisa de atenção.

| Onde                       | O que mudou                                                                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Painel                     | indicadores clicáveis (levam à lista filtrada), atrasos em **dias**, "vencem nos próximos 3 dias", **mais emprestados** com barras |
| Materiais                  | busca por nome/código, filtro por tipo e por estado                                                                                |
| Colaboradores              | busca por nome/matrícula/setor; inativos escondidos (caixa "Mostrar inativos")                                                     |
| Empréstimos                | abas Em aberto / Atrasados / Devolvidos / Todos, busca por colaborador e **paginação** (10 por página)                             |
| Qualquer página do sistema | `error.tsx`: erro inesperado mostra uma tela amigável com "Tentar de novo"                                                         |

O seed agora tem 19 empréstimos (14 antigos já devolvidos) pra ter o que paginar.

## Conceitos

### 1. O estado mora na URL — `searchParams`

```
/emprestimos?situacao=atrasados&busca=ana&pagina=2
```

Em vez de `useState`, os filtros ficam na URL. Por quê?

- **F5 não perde** o filtro; o link pode ser **compartilhado**; o **voltar** do navegador funciona.
- A **página (Server Component)** lê `searchParams` e filtra **no banco** (`where`, `skip`, `take`). O navegador não baixa a lista inteira pra filtrar.

```tsx
export default async function EmprestimosPage({ searchParams }: PageProps<"/emprestimos">) {
  const parametros = await searchParams;          // também é Promise no Next 15+
  const situacao = lerOpcao(parametros.situacao, SITUACOES, "abertos");
```

### 2. Nunca confie na URL — `src/lib/filtros.ts`

Qualquer um digita qualquer coisa na URL. `searchParams` vem como `string | string[] | undefined`. As funções convertem e, se não fizer sentido, usam o padrão:

| Função      | Exemplo                                             |
| ----------- | --------------------------------------------------- |
| `lerTexto`  | `"  fur "` → `"fur"`; vazio → `undefined`           |
| `lerPagina` | `"2"` → 2; `"abc"` ou `"-5"` → 1                    |
| `lerOpcao`  | `"atrasados"` → `"atrasados"`; `"hackear"` → padrão |

`lerOpcao` é uma **função genérica** (`<const T extends string>`) com **overloads**: o tipo de retorno sai da lista que você passa.

`SITUACOES = [...] as const` + `(typeof SITUACOES)[number]` → o union type nasce do array.

### 3. Dois jeitos de mudar a URL

- **Links simples** (abas de situação, paginação) — `src/components/app/paginacao.tsx`: Server Component, funciona sem JavaScript. `urlCom()` troca um parâmetro e mantém os outros.
- **Client Components** (busca, selects) — `src/components/app/filtros-url.tsx`:
  - `useSearchParams()` lê; `router.replace()` grava. `replace` e não `push`: digitar uma busca não enche o histórico do "voltar".
  - `useTransition`: enquanto o servidor monta a página nova, a antiga continua na tela (esmaecida), sem piscar o esqueleto.
  - **Debounce** de 300 ms com `useRef` + `setTimeout`: "furadeira" faz 1 busca no banco, não 9. A lógica fica no evento `onChange` (nada de `useEffect`, lição da fase 3).
  - `useRef` = caixinha que guarda um valor entre redesenhos **sem** causar redesenho.
  - Componentes que usam `useSearchParams` ficam dentro de `<Suspense>` (exigência do Next 16).

### 4. Paginação com `skip` / `take` — `paginarEmprestimos()`

```ts
prisma.emprestimo.findMany({ where, skip: (pagina - 1) * 10, take: 10 }); // OFFSET / LIMIT
prisma.emprestimo.count({ where }); // total de páginas
```

As duas em paralelo. O `where` é montado por partes, com o tipo `Prisma.EmprestimoWhereInput`. Filtro **pela relação**: `where.colaborador = { nome: { contains: busca } }`.

Busca sem diferenciar maiúsculas: `contains` + `mode: "insensitive"` (vira `ILIKE` no Postgres). Por isso "ana" também acha a Juli**ana**.

### 5. Ranking com `groupBy` — `materiaisMaisEmprestados()`

```ts
groupBy({
  by: ["materialId"],
  _sum: { quantidade: true },
  orderBy: { _sum: { quantidade: "desc" } },
  take: 5,
});
```

É o `GROUP BY ... ORDER BY SUM(...) DESC LIMIT 5` do SQL. O `groupBy` só devolve o id, então uma segunda consulta (com `IN`) busca os nomes. A barra é uma `div` com `width` em % do maior.

### 6. Regras novas puras — `src/lib/regras.ts`

`diasDeAtraso()` e `venceEmBreve()` não tocam no banco: recebem o empréstimo e a data. O badge virou "Atrasado · 4 dias".

### 7. `error.tsx` — `src/app/(app)/error.tsx`

Se qualquer página de `(app)` lançar um erro inesperado, o Next mostra esse componente **no lugar da página** (o menu continua). No Next 16:

- recebe `error: unknown` — pode não ser um `Error`, então checamos com `instanceof`;
- erros do servidor chegam **sem a mensagem real** (pra não vazar detalhes) e com um `digest`, um código que bate com o log do servidor;
- `retry()` busca de novo e redesenha (antes se chamava `reset`).

Pra ver: coloque `throw new Error("teste")` no começo do painel, abra, desfaça e clique "Tentar de novo".

### 8. Dica de ambiente

Se aparecer `ECONNREFUSED` (conexão recusada), o banco local caiu (o computador desligou ou hibernou). `npm run db:start` resolve.

## Exercícios

1. **Ordenação na URL**: em Materiais, um select "Ordenar por" (nome, disponível) usando `?ordem=` e `orderBy` no Prisma.
2. **Filtro por colaborador nos empréstimos**: `?colaborador=<id>` e um link "Ver todos" na página do colaborador.
3. **Paginação com números**: mostrar `1 2 3 … 10` em vez de só Anterior/Próxima.
4. **Busca exata no início**: troque `contains` por `startsWith` e compare os resultados de "ana".
5. **Painel**: um card "Disponíveis agora" (soma do disponível de todos os materiais em bom estado).
6. **Desafio — filtro por período**: em Empréstimos, `?de=2026-11-01&ate=2026-11-30` filtrando `retiradoEm` (`gte`/`lte`), com dois `<input type="date">`.
