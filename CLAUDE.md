@AGENTS.md

# Retira

SaaS de almoxarifado: a empresa cadastra materiais e colaboradores e registra retiradas e devoluções (empréstimo interno, sem cobrança).

É um projeto de **estudo** de React + TypeScript + Next.js. Ao escrever código, explique o porquê dos conceitos novos e prefira código simples e legível a abstrações espertas. Responda sempre em português.

- Plano e fases: `docs/plano.md`
- Fluxo de escrita: `src/schemas` (Zod, roda no navegador e no servidor) → `src/actions` ("use server", valida e chama o service, devolve `Resultado`) → `src/services` (regras + Prisma, recebem `empresaId`, lançam `RegraDeNegocioError`). Services pensados pra virar a API em Java.
- Toda consulta ao banco filtra por `empresaId` da sessão (multi-empresa).
- Banco: `npm run db:start` (Postgres local), `db:migrate`, `db:seed`, `db:studio`. Mudou o schema → `npm run db:migrate`.
- Next 16 com Cache Components: páginas que leem o banco precisam de `loading.tsx` na própria pasta; consultas passam por `empresaAtualId()` (que chama `connection()`).
- Antes de commitar: `npm run lint`, `npm run typecheck`, `npm run format:check`.
- Commits e PRs só em nome do autor: **não** adicionar `Co-Authored-By` nem rodapé de "Generated with Claude Code".
