# Retira

**Saiba com quem está cada material.** Almoxarifado para empresas: cadastre materiais e colaboradores e registre retiradas e devoluções.

Projeto de estudo de React + TypeScript + Next.js.

## Rodando

```powershell
npm install
copy .env.example .env
npm run db:start      # Postgres local do Prisma (sem instalar nada)
npm run db:migrate    # cria as tabelas
npm run db:seed       # dados de exemplo
npm run dev
```

Testes:

```powershell
npm test            # unidade (Vitest)
npm run test:e2e    # ponta a ponta (Playwright) — recria os dados de exemplo
```

Abra http://localhost:3000 e entre com `admin@exemplo.com` / `retira123` (criado pelo seed), ou cadastre uma empresa nova.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma 7 + PostgreSQL · Zod 4 · React Hook Form · login próprio (sessão no banco + scrypt)

Próximas fases: testes e deploy (Vercel + Neon) · API em Java.

## Documentação

- [Plano e fases](docs/plano.md)
- [Fase 0 — o que é cada arquivo](docs/fase-0.md)
- [Fase 1 — telas com dados falsos](docs/fase-1.md)
- [Fase 2 — banco de dados com Prisma](docs/fase-2.md)
- [Fase 3 — cadastros com Server Actions, Zod e React Hook Form](docs/fase-3.md)
- [Fase 4 — login e empresas](docs/fase-4.md)
- [Fase 5 — empréstimos, devolução e termo](docs/fase-5.md)
- [Fase 6 — painel, busca, filtros e paginação](docs/fase-6.md)
- [Fase 7 — testes, CI e deploy](docs/fase-7.md)
