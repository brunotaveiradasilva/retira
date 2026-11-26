# Fase 1 · Telas com dados falsos

O sistema já tem cara de sistema: barra lateral, painel, materiais, colaboradores e empréstimos. Tudo lendo de arrays em memória. Nenhum banco ainda: o foco é React, TypeScript e as rotas do Next.

Abra http://localhost:3000 → **Ver demonstração**.

## O que foi criado

```
src/
  types/index.ts                 ← os tipos do domínio (Material, Colaborador, Emprestimo...)
  lib/
    mock-data.ts                 ← os dados falsos
    consultas.ts                 ← funções que "consultam" os dados (vira Prisma na fase 2)
    formatar.ts                  ← datas e textos em português
  components/app/
    nav-links.tsx                ← menu ("use client" por causa do usePathname)
    page-header.tsx              ← título + descrição + botões de uma página
    lista-emprestimos.tsx        ← tabela de empréstimos usada em 4 telas
    badges.tsx                   ← etiquetas de estado e status
    avatar-iniciais.tsx          ← bolinha com "AS" de Ana Souza
    carregando-detalhe.tsx       ← esqueleto de carregamento
  app/
    not-found.tsx                ← página 404
    (app)/                       ← route group: divide o layout, não aparece na URL
      layout.tsx                 ← barra lateral (computador) / barra do topo (celular)
      painel/page.tsx            ← /painel
      materiais/page.tsx         ← /materiais
      materiais/[id]/page.tsx    ← /materiais/m1, /materiais/m2...
      materiais/[id]/loading.tsx
      colaboradores/page.tsx
      colaboradores/[id]/page.tsx
      colaboradores/[id]/loading.tsx
      emprestimos/page.tsx
```

## Conceitos, com onde olhar

### 1. Tipos do domínio — `src/types/index.ts`

```ts
export type EstadoMaterial = "BOM" | "DANIFICADO" | "MANUTENCAO" | "BAIXADO";
```

**Union type**: só esses quatro textos são aceitos. Escreva `estado: "QUEBRADO"` no `mock-data.ts` e veja o erro.

`codigo?: string` → **opcional**. Por isso as telas fazem `{material.codigo && ...}` antes de mostrar.

### 2. Separar dados de tela — `src/lib/consultas.ts`

As páginas nunca leem o array `materiais` direto: chamam `listarMateriais()`, `buscarMaterial(id)`... Na fase 2 só o **corpo** dessas funções muda (vira Prisma). As telas continuam iguais. Esse é o motivo de existir a camada.

`buscarMaterial` retorna `Material | undefined`. O TypeScript **obriga** a tela a tratar o "não achou":

```tsx
const material = buscarMaterial(id);
if (!material) notFound(); // daqui pra baixo, material é Material (nunca undefined)
```

Isso se chama **narrowing** (estreitamento de tipo).

### 3. `Record<Chave, Valor>` — `src/lib/formatar.ts` e `badges.tsx`

```ts
export const nomeDoEstado: Record<EstadoMaterial, string> = { BOM: "Bom", ... };
```

Obriga a ter **todas** as chaves. Adicione `"EMPRESTADO"` ao `EstadoMaterial` e o TypeScript aponta todos os lugares que precisam do texto novo.

### 4. Route group `(app)` — `src/app/(app)/layout.tsx`

Pasta entre parênteses agrupa páginas para dividirem um layout **sem entrar na URL**. A página inicial está fora do grupo, por isso não tem barra lateral.

### 5. Server Component × Client Component — `nav-links.tsx`

Quase tudo roda no servidor. Só o menu tem `"use client"`, porque precisa de `usePathname()` (um hook) para saber qual item acender. Regra prática: **comece no servidor e só desça para o cliente o pedacinho que precisa de interação.**

### 6. Rotas dinâmicas — `materiais/[id]/page.tsx`

- A pasta `[id]` captura qualquer valor: `/materiais/m1` → `id = "m1"`.
- No Next 15+ o `params` é uma **Promise**, por isso `async` + `await params`.
- `PageProps<"/materiais/[id]">` é um tipo **gerado pelo Next**: ele sabe que essa rota tem um `id`.
- `generateStaticParams()` lista os ids existentes; o Next gera essas páginas já no build (veja o `npm run build`).
- `generateMetadata()` muda o título da aba para o nome do material.
- `loading.tsx` mostra um esqueleto enquanto a página carrega. No Next 16 com Cache Components ele também deixa a navegação instantânea: sem ele, o terminal mostra o aviso _"encountered URL data during prerendering"_.

### 7. Componentes reaproveitáveis — `lista-emprestimos.tsx`

A mesma tabela aparece no painel, em empréstimos, no material e no colaborador. As diferenças viram **props**: `semColaborador` esconde uma coluna, `vazio` troca a mensagem. Escrever uma vez, usar em vários lugares.

### 8. Props que são componentes ou JSX

- `acoes?: ReactNode` no `PageHeader`: recebe qualquer coisa desenhável (um botão, um badge).
- `icone: LucideIcon` no menu e no painel: recebe o **componente** do ícone. Para desenhar, a variável precisa começar com maiúscula: `const Icone = item.icone; <Icone />`.

### 9. Métodos de array que aparecem muito

| Método          | Onde                            | O que faz                                          |
| --------------- | ------------------------------- | -------------------------------------------------- |
| `.map`          | todas as listas                 | transforma cada item em JSX                        |
| `.filter`       | `estaAberto`, atrasados         | fica só com os que passam no teste                 |
| `.find`         | `buscarMaterial`                | o primeiro que bate (ou `undefined`)               |
| `.some`         | `temAtraso`                     | "pelo menos um?"                                   |
| `.reduce`       | `resumoDoPainel`, `itensComEle` | soma tudo num valor só                             |
| `.flatMap`      | colaboradores                   | junta os itens de vários empréstimos numa lista só |
| `[...arr].sort` | `listarMateriais`               | ordena uma **cópia** (o `.sort` muda o original)   |

### 10. Data fixa — `HOJE` em `mock-data.ts`

`new Date()` muda a cada execução e o Next 16 (Cache Components) não deixa usar isso solto durante o build. Por enquanto usamos uma data fixa; na fase 2 veremos como lidar com dados que mudam.

## Exercícios

1. **Novo material**: adicione um item em `materiais` (ex.: "Escada 7 degraus"). Ele aparece na lista e tem página própria sem você criar nada.
2. **Erro de propósito**: coloque `estado: "QUEBRADO"` num material e rode `npm run typecheck`.
3. **Nova coluna**: mostre o `controle` ("Unitário"/"Quantidade") na tabela de materiais. Dica: crie `nomeDoControle: Record<Controle, string>` em `formatar.ts`.
4. **Nova página**: crie `/tipos` listando os tipos de material com a quantidade de materiais de cada um, e adicione no menu (`nav-links.tsx`, ícone `Tags` do lucide).
5. **Regra nova**: em `consultas.ts`, crie `materiaisDisponiveis()` (estado BOM e disponível > 0) e mostre o total no painel como um quinto indicador.
6. **Desafio**: no detalhe do material, se o estado não for BOM, mostre um aviso em destaque explicando que ele não pode ser emprestado.
