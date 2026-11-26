# Fase 0 · Setup — o que é cada coisa

## Como o projeto foi criado

```powershell
npx create-next-app@latest retira --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
npx shadcn@latest init -d
npx shadcn@latest add button card
npm i -D prettier prettier-plugin-tailwindcss eslint-config-prettier
```

| Flag                   | Significa                                                                |
| ---------------------- | ------------------------------------------------------------------------ |
| `--ts`                 | TypeScript em vez de JavaScript                                          |
| `--tailwind`           | Tailwind CSS (estilo por classes: `flex gap-4 text-lg`)                  |
| `--eslint`             | Linter: aponta erros e más práticas no código                            |
| `--app`                | App Router (pasta `app/`), o modelo atual do Next                        |
| `--src-dir`            | Código dentro de `src/`, separado das configs da raiz                    |
| `--import-alias "@/*"` | `import x from "@/components/logo"` em vez de `../../../components/logo` |
| `--turbopack`          | Bundler novo e rápido do Next (substitui o Webpack)                      |

## Comandos do dia a dia

```powershell
npm run dev          # servidor de desenvolvimento em http://localhost:3000
npm run lint         # ESLint
npm run typecheck    # TypeScript confere os tipos sem gerar arquivos
npm run format       # Prettier formata tudo
npm run build        # build de produção (o que a Vercel roda)
```

## Arquivos da raiz

| Arquivo                   | Para que serve                                                                                                                                                                    |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`            | Nome do projeto, scripts (`npm run ...`) e dependências. `dependencies` vão pra produção; `devDependencies` são só ferramentas de desenvolvimento.                                |
| `package-lock.json`       | Trava a versão exata de cada pacote. Sempre commitar. Nunca editar à mão.                                                                                                         |
| `tsconfig.json`           | Configuração do TypeScript. Destaques: `"strict": true` (modo rigoroso — é o que mais ensina), `"paths"` (o alias `@/*`), `"noEmit"` (quem compila é o Next, o `tsc` só confere). |
| `next.config.ts`          | Configuração do Next. `cacheComponents` liga o modelo novo de cache do Next 16 (vamos ver na fase 2).                                                                             |
| `next-env.d.ts`           | Tipos do Next pro TypeScript. Gerado automaticamente, não mexer.                                                                                                                  |
| `eslint.config.mjs`       | Regras do ESLint (as recomendadas do Next + TypeScript). O `prettier` no fim desliga regras de formatação, que ficam com o Prettier.                                              |
| `.prettierrc`             | Prettier formata o código; o plugin do Tailwind ordena as classes sempre do mesmo jeito.                                                                                          |
| `components.json`         | Configuração do shadcn: onde ficam os componentes, qual CSS, quais ícones (lucide).                                                                                               |
| `.gitignore`              | O que o Git ignora: `node_modules`, `.next`, `.env*`...                                                                                                                           |
| `AGENTS.md` / `CLAUDE.md` | Instruções para assistentes de IA que trabalham no projeto.                                                                                                                       |

## Pasta `src/`

```
src/
  app/                 ← rotas: cada pasta vira uma URL
    layout.tsx         ← envolve todas as páginas (<html>, <body>, fonte, título)
    page.tsx           ← a página da rota "/"
    globals.css        ← Tailwind + cores do tema (variáveis CSS)
    icon.svg           ← ícone da aba; o Next detecta pelo nome do arquivo
  components/
    ui/                ← componentes do shadcn (button, card). São SEUS: pode ler e alterar.
    logo.tsx           ← nosso primeiro componente
  lib/
    utils.ts           ← função cn() pra juntar classes do Tailwind
  services/ actions/ schemas/   ← vazias por enquanto (fase 3)
```

### Conceitos que já aparecem

**Convenção por nome de arquivo.** No App Router o Next procura nomes específicos: `page.tsx` (página), `layout.tsx` (moldura), `icon.svg` (ícone), e depois `loading.tsx`, `error.tsx`, `not-found.tsx`. Criar `src/app/materiais/page.tsx` já cria a rota `/materiais`.

**Server Components.** `page.tsx` e `layout.tsx` rodam no servidor por padrão. Podem ser `async` e buscar dados direto (fase 2). Só quando precisar de interação (`useState`, `onClick`) colocamos `"use client"` no topo do arquivo.

**Props tipadas** (`src/components/logo.tsx`):

```tsx
type LogoIconProps = { size?: number; className?: string };
export function LogoIcon({ size = 32, className }: LogoIconProps) { ... }
```

- `size?` → opcional; `= 32` → valor padrão.
- `type LogoProps = LogoIconProps & { iconOnly?: boolean }` → `&` junta dois tipos (intersection).
- Tente usar `<Logo size="grande" />` na página: o editor sublinha em vermelho. É o TypeScript trabalhando.

**Listas com `.map` e `key`** (`src/app/page.tsx`): o array `recursos` vira três `<Card>`. A `key` precisa ser única para o React saber qual item é qual quando a lista muda.

**`cn()`**: junta classes condicionais e resolve conflitos do Tailwind. `cn("p-2", "p-4")` → `"p-4"`.

**Tema**: as cores ficam em variáveis no `globals.css` (`--primary` = verde-petróleo `#0F766E`). Os componentes usam `bg-primary`, `text-muted-foreground` etc. Trocar a cor da marca é mudar uma linha.

## Exercícios antes da fase 1

1. Mude `--primary` no `globals.css` para outra cor e veja o botão e o logo mudarem juntos.
2. Adicione um quarto item em `recursos` (ex.: "Painel") e veja o grid se ajustar.
3. Crie `src/app/sobre/page.tsx` com um `<h1>` e acesse `/sobre`.
4. Passe `iconOnly` no `<Logo>` do cabeçalho.
5. Rode `npm run typecheck` depois de colocar um erro de tipo de propósito.
