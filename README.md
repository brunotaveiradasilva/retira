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

Abra http://localhost:3000.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Prisma 7 + PostgreSQL

Próximas fases: Zod + Server Actions · Auth.js · Vercel + Neon.

## Documentação

- [Plano e fases](docs/plano.md)
- [Fase 0 — o que é cada arquivo](docs/fase-0.md)
- [Fase 1 — telas com dados falsos](docs/fase-1.md)
- [Fase 2 — banco de dados com Prisma](docs/fase-2.md)
