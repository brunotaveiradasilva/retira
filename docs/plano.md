# Plano do Retira

## O que é

A empresa se cadastra, organiza os materiais por tipo, cadastra os colaboradores e registra **quem retirou o quê, quando e quando precisa devolver**. Empréstimo interno, sem cobrança.

- **Usuário**: quem faz login (dono/almoxarife). Pertence a uma empresa.
- **Colaborador**: quem pega o material. Não tem login.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind + shadcn/ui · React Hook Form + Zod · Prisma 7 + PostgreSQL (local com `prisma dev`, Neon no deploy) · login próprio (sessão no banco; Auth.js segue em beta) · Vercel.
Futuro: API em Java (Spring Boot) no mesmo Postgres.

## Modelo de dados

```
Empresa 1──N Usuario
Empresa 1──N Material
Empresa 1──N Colaborador
Empresa 1──N Emprestimo N──1 Colaborador
Emprestimo 1──N ItemEmprestimo N──1 Material
```

- `Material.controle`: `UNITARIO` (1 furadeira = 1 registro) · `QUANTIDADE` (50 luvas) · `CONSUMIVEL` (não volta — pós-MVP)
- `Material.estado`: `BOM` · `DANIFICADO` · `MANUTENCAO` · `BAIXADO`
- `Emprestimo.status`: `ABERTO` · `PARCIAL` · `DEVOLVIDO` (atrasado é calculado, não salvo)

## Regras de negócio

- Material `UNITARIO` só pode estar em um empréstimo aberto por vez.
- `QUANTIDADE`: disponível = total − emprestado. Não empresta mais do que tem.
- `MANUTENCAO`/`BAIXADO` não aparecem para empréstimo.
- Devolução pode ser parcial; devolveu danificado → material vira `DANIFICADO`.
- Retirada e devolução rodam em transação (`prisma.$transaction`).
- Colaborador com empréstimo aberto não é excluído, só desativado (e o sistema avisa).
- Toda consulta filtra por `empresaId` da sessão.

## Rotas

```
/  /cadastro  /login
/(app)/painel
/(app)/materiais  /materiais/novo  /materiais/[id]
/(app)/tipos
/(app)/colaboradores  /colaboradores/[id]
/(app)/emprestimos  /emprestimos/novo  /emprestimos/[id]
/(app)/configuracoes
```

## Fases

| Fase               | Entrega                                                        | O que se aprende                                                  |
| ------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| 0 · Setup ✅       | Projeto criado, shadcn, Prettier, logo                         | Estrutura do Next, tsconfig, ESLint/Prettier                      |
| 1 · Telas mock ✅  | Layout com sidebar, listas com dados falsos                    | Componentes, props tipadas, `.map`, rotas e layouts, `[id]`       |
| 2 · Banco ✅       | Prisma + Postgres, migrations, seed                            | Server Components assíncronos, tipos gerados                      |
| 3 · CRUD ✅        | Tipos, materiais, colaboradores                                | Server Actions, Zod, React Hook Form, `"use client"`, `refresh()` |
| 4 · Auth ✅        | Cadastro cria empresa, login, rotas protegidas                 | Sessão no banco, cookies, proxy, scrypt, multi-tenant             |
| 5 · Empréstimos ✅ | Retirada com vários itens, devolução parcial, termo imprimível | `useFieldArray`, transações, union types                          |
| 6 · Painel ✅      | Cards, atrasados, histórico                                    | Agregações, `searchParams`, `loading.tsx`, `error.tsx`            |
| 7 · Qualidade ✅   | Vitest, Playwright, CI, deploy Vercel                          | Testes, env vars, GitHub Actions                                  |
| 8 · Java           | API Spring Boot no mesmo Postgres                              | Spring Boot, JPA, REST                                            |

Ciclo de cada feature: **schema Zod → service → action → formulário → lista/detalhe → teste do service**.

## Mudanças depois das fases

| Data       | Mudança                                                                                                                                                                                                                                                                                                                                 | Por quê                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 27/11/2026 | **Tipos de material removidos** (menu, página, campo, filtro, coluna; migration `remover_tipos` apaga a tabela `tipos_material` e a coluna `materiais.tipo_id`)                                                                                                                                                                         | No uso real o campo não era necessário e obrigava criar um tipo antes do primeiro material. Os guias das fases 1–3 ainda mostram os tipos: é o histórico de como foi construído. |
| 27/11/2026 | **Calendário e evento no empréstimo**: a retirada ganha data de retirada (pode ser outro dia), data do evento, local e endereço (com link pro Google Maps); a página nova `/calendario` mostra mês a mês com quem está cada material. A migration `evento_no_emprestimo` só adiciona colunas.                                           | Os materiais saem pra eventos: é preciso ver o período (retirada → evento → devolução) e onde o material vai estar.                                                              |
| 27/11/2026 | **Código de 4 dígitos** em materiais e colaboradores (0001…9999), gerado sozinho e sequencial por empresa, com sequências separadas. O antigo "código" do material passa a se chamar "Patrimônio"; matrícula continua. A migration `codigo_de_4_digitos` numera os cadastros existentes pela ordem de criação. A busca aceita o código. | Identificar material e colaborador por um número curto, igual pra todos, sem depender de patrimônio ou matrícula preenchidos.                                                    |
