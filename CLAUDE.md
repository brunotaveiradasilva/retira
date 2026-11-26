@AGENTS.md

# Retira

SaaS de almoxarifado: a empresa cadastra materiais e colaboradores e registra retiradas e devoluções (empréstimo interno, sem cobrança).

É um projeto de **estudo** de React + TypeScript + Next.js. Ao escrever código, explique o porquê dos conceitos novos e prefira código simples e legível a abstrações espertas. Responda sempre em português.

- Plano e fases: `docs/plano.md`
- Fluxo de escrita: `src/schemas` (Zod, roda no navegador e no servidor) → `src/actions` ("use server", valida e chama o service, devolve `Resultado`) → `src/services` (regras + Prisma, recebem `empresaId`, lançam `RegraDeNegocioError`). Services pensados pra virar a API em Java.
- Toda consulta e toda action chamam `empresaAtualId()` (`src/lib/empresa-atual.ts`): lê a sessão do banco e redireciona pro /login se não houver. Filtrar sempre por `empresaId`.
- Login próprio: `src/lib/senha.ts` (scrypt), `src/lib/sessao.ts` (token no cookie, hash na tabela `sessoes`), `src/proxy.ts` (checagem otimista só pelo cookie). Logins do seed: `admin@exemplo.com` e `oficina@exemplo.com`, senha `retira123`.
- Banco: `npm run db:start` (Postgres local), `db:migrate`, `db:seed`, `db:studio`. Mudou o schema → `npm run db:migrate` e **reiniciar o `npm run dev`** (o Prisma Client fica em `globalThis`).
- Next 16 com Cache Components: páginas que leem o banco precisam de `loading.tsx` na própria pasta; componentes do layout que leem a sessão ficam dentro de `<Suspense>`. Rota nova → `npx next typegen` antes do `tsc`.
- Antes de commitar: `npm run lint`, `npm run typecheck`, `npm run format:check`.
- Commits e PRs só em nome do autor: **não** adicionar `Co-Authored-By` nem rodapé de "Generated with Claude Code".
