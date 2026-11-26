@AGENTS.md

# Retira

SaaS de almoxarifado: a empresa cadastra materiais e colaboradores e registra retiradas e devoluções (empréstimo interno, sem cobrança).

É um projeto de **estudo** de React + TypeScript + Next.js. Ao escrever código, explique o porquê dos conceitos novos e prefira código simples e legível a abstrações espertas. Responda sempre em português.

- Plano e fases: `docs/plano.md`
- Regras de negócio ficam em `src/services/` (sem React), pensando numa futura API em Java.
- Toda consulta ao banco filtra por `empresaId` da sessão (multi-empresa).
- Antes de commitar: `npm run lint`, `npm run typecheck`, `npm run format:check`.
- Commits e PRs só em nome do autor: **não** adicionar `Co-Authored-By` nem rodapé de "Generated with Claude Code".
