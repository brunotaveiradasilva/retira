# Fase 2 · Banco de dados (Prisma + Postgres)

Os dados falsos foram embora. Agora tudo vem de um **PostgreSQL** de verdade, acessado pelo **Prisma 7**.

## Como rodar (primeira vez)

```powershell
npm install            # instala e já roda `prisma generate` (postinstall)
copy .env.example .env # se ainda não existir
npm run db:start       # sobe o Postgres local do Prisma (em segundo plano)
npm run db:migrate     # cria as tabelas
npm run db:seed        # coloca os dados de exemplo
npm run dev
```

Nos dias seguintes basta `npm run db:start` e `npm run dev`.

| Script                 | O que faz                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| `db:start` / `db:stop` | Liga/desliga o Postgres local (`prisma dev`). Não precisa instalar Postgres nem Docker.      |
| `db:migrate`           | Compara o `schema.prisma` com o banco e cria uma **migration** (arquivo SQL) com a diferença |
| `db:generate`          | Gera o Prisma Client (os tipos e funções) a partir do schema                                 |
| `db:seed`              | Roda `prisma/seed.ts`: apaga tudo e recria os dados de exemplo                               |
| `db:reset`             | Apaga o banco, reaplica todas as migrations e roda o seed                                    |
| `db:studio`            | Abre o **Prisma Studio** no navegador pra ver e editar as tabelas                            |

> O banco local fica só na sua máquina. Na fase 7 (deploy) trocamos o `DATABASE_URL` pelo do **Neon**.

## Arquivos novos

```
prisma.config.ts                 ← config do CLI: onde está o schema, migrations, seed, DATABASE_URL
prisma/
  schema.prisma                  ← o modelo de dados (tabelas, colunas, relações, enums)
  migrations/2026..._inicial/    ← o SQL que criou as tabelas (commitado no git!)
  seed.ts                        ← dados de exemplo
.env / .env.example              ← DATABASE_URL (o .env NÃO vai pro git)
src/
  generated/prisma/              ← Prisma Client gerado (NÃO vai pro git; o postinstall gera)
  lib/prisma.ts                  ← a conexão (uma instância só)
  lib/empresa-atual.ts           ← qual empresa está usando + data/hora "de agora"
  lib/consultas.ts               ← reescrito: consultas ao banco
  lib/regras.ts                  ← regras puras (atrasado, disponível...) sem banco
  app/(app)/*/loading.tsx        ← esqueleto de carregamento por página
```

Saíram: `src/lib/mock-data.ts` e os tipos escritos à mão (agora `src/types` só reexporta do Prisma).

## Conceitos

### 1. O schema é a fonte da verdade — `prisma/schema.prisma`

```prisma
model Material {
  id        String  @id @default(cuid())
  estado    EstadoMaterial @default(BOM)
  tipoId    String  @map("tipo_id")
  tipo      TipoMaterial @relation(fields: [tipoId], references: [id])
  ...
  @@map("materiais")
}
```

- `@id @default(cuid())` → chave primária gerada automaticamente (por isso as URLs viraram `/materiais/cmwy0uw2q...`).
- `tipoId` é a **coluna** (chave estrangeira); `tipo` é a **relação** (não vira coluna, serve pra navegar: `material.tipo.nome`).
- `@map`/`@@map` → no código `tipoId`, no banco `tipo_id`, tabela `materiais`. Banco em snake_case é o padrão que o Java/JPA também espera (fase 8).
- `@@unique([empresaId, codigo])` → o mesmo código pode existir em empresas diferentes, mas não repetir dentro de uma.

Do schema saem **duas coisas**: o SQL (migration) e os tipos TypeScript (client). Mude o schema → `npm run db:migrate` → o TypeScript aponta tudo que quebrou.

### 2. Migrations — `prisma/migrations/`

Cada mudança no schema vira uma pasta com um `migration.sql`. Abra o da migration `inicial` e compare com o schema: é exatamente o `CREATE TABLE` que você escreveria à mão. As migrations vão pro git porque são o histórico do banco: quem clonar o projeto (ou o servidor de produção) aplica as mesmas, na mesma ordem.

### 3. Conexão única — `src/lib/prisma.ts`

- Prisma 7 usa um **adapter** (`@prisma/adapter-pg`) que fala com o Postgres pelo driver `pg`.
- `import "server-only"`: se alguém importar isso num Client Component, o build quebra. Garante que o acesso ao banco (e a senha) nunca vão pro navegador.
- O truque do `globalThis`: em desenvolvimento o Next recarrega os módulos a cada save; sem isso, cada recarga abriria uma conexão nova.

### 4. Multi-empresa desde já — `src/lib/empresa-atual.ts`

Toda consulta começa com `const empresaId = await empresaAtualId()` e filtra `where: { empresaId }`. Por enquanto devolve a empresa do seed; na **fase 4** vai sair do login. Como todas as consultas já passam por ali, só essa função vai mudar.

Por isso também `buscarMaterial` usa `findFirst({ where: { id, empresaId } })` e não `findUnique({ where: { id } })`: um id de outra empresa simplesmente "não existe".

### 5. Consultas do Prisma — `src/lib/consultas.ts`

| Prisma                            | SQL equivalente                 | Onde                       |
| --------------------------------- | ------------------------------- | -------------------------- |
| `findMany({ where, orderBy })`    | `SELECT ... WHERE ... ORDER BY` | `listarMateriais`          |
| `include: { tipo: true }`         | `JOIN`                          | material com o tipo        |
| `itens: { some: { materialId } }` | `WHERE EXISTS (...)`            | empréstimos de um material |
| `count`                           | `SELECT COUNT(*)`               | painel                     |
| `aggregate({ _sum })`             | `SELECT SUM(...)`               | unidades fora              |
| `groupBy({ by, _sum })`           | `GROUP BY`                      | emprestado por material    |
| `distinct`                        | `SELECT DISTINCT`               | colaboradores com material |

**Tipos derivados das consultas:**

```ts
const comDetalhes = {
  colaborador: true,
  itens: { include: { material: true } },
} satisfies Prisma.EmprestimoInclude;
export type EmprestimoDetalhado = Prisma.EmprestimoGetPayload<{
  include: typeof comDetalhes;
}>;
```

O tipo muda sozinho se você mudar o `include`. E `Awaited<ReturnType<typeof listarMateriais>>[number]` = "o tipo de um item que essa função devolve".

### 6. async/await e Promise.all — páginas

As páginas viraram `async` e fazem `await` nas consultas. Quando duas consultas não dependem uma da outra:

```ts
const [materiais, emprestadas] = await Promise.all([
  listarMateriais(),
  unidadesEmprestadasPorMaterial(),
]);
```

As duas rodam **ao mesmo tempo**. O painel faz 4 contagens em paralelo.

### 7. Menos regra na tela, menos ida ao banco — `lista-emprestimos.tsx` e `regras.ts`

Na fase 1 a lista buscava o colaborador e cada material um por um (`buscarMaterial` dentro do `.map`). Com banco, isso seria **uma consulta por linha** (o famoso problema N+1). Agora a consulta já traz tudo com `include`, e o componente só desenha.

As regras (`estaAtrasado`, `quantidadeDisponivel`, `unidadesPendentes`) foram pra `regras.ts`: funções puras, sem banco, fáceis de testar na fase 7. Elas usam `Pick<Emprestimo, "status" | "previsaoDevolucao">` pra aceitar qualquer objeto que tenha esses campos.

### 8. `null` × `undefined`

No banco, campo vazio é `null`. Na fase 1 os opcionais eram `undefined`. Por isso `formatarData` passou a aceitar `Date | null | undefined` — o TypeScript avisou na hora.

### 9. Next 16 e dados que mudam: `connection()`, `loading.tsx` e `<Suspense>`

Com **Cache Components** ligado, o Next tenta montar o máximo possível de cada página **no build**. Dados do banco mudam a toda hora, então:

- **`await connection()`** (em `empresa-atual.ts`): avisa "isto depende da requisição". O build não consulta o banco; a página é montada a cada acesso. O `agora()` usa o mesmo truque pra ler a data/hora real (na fase 1 era uma data fixa).
- **`loading.tsx` em cada pasta de página**: é o `<Suspense>` que mostra o esqueleto enquanto o banco responde. Tem que ser **na pasta da própria página**: um `loading.tsx` só em `(app)/` fica acima do layout compartilhado e não aparece ao navegar de uma página pra outra (o terminal acusa _"uncached data … outside of Suspense"_).
- **Menu com `<Suspense>`** (`nav-links.tsx`): `usePathname()` em rotas `[id]` só tem valor na hora do acesso. O menu aparece sem destaque no primeiro instante e acende o item certo logo depois.
- Saiu o `generateStaticParams` dos `[id]`: os ids agora vêm do banco e mudam.

No `npm run build` as páginas aparecem como **◐ Partial Prerender**: a moldura (layout, menu, esqueleto) sai pronta do build e o conteúdo chega na hora.

> Vamos ver `"use cache"` quando tiver algo que valha cachear. Por enquanto, dado sempre fresco.

## Exercícios

1. **Prisma Studio**: rode `npm run db:studio`, mude o estado da furadeira para `MANUTENCAO` e recarregue `/materiais`. Depois volte com `npm run db:seed`.
2. **Ler o SQL**: abra `prisma/migrations/*_inicial/migration.sql` e ache o `FOREIGN KEY` de `itens_emprestimo` para `emprestimos` com `ON DELETE CASCADE`.
3. **Nova coluna**: adicione `observacao String?` ao `Material`, rode `npm run db:migrate -- --name material-observacao` (o `--` passa o resto pro Prisma, não pro npm), veja a migration nova e mostre a observação no detalhe do material.
4. **Nova consulta**: crie `listarTipos()` em `consultas.ts` que traga cada tipo com a quantidade de materiais (`include: { _count: { select: { materiais: true } } }`) e use na página `/tipos` (exercício 4 da fase 1).
5. **Filtro no banco**: na lista de colaboradores, esconda os inativos filtrando no `where` (não no JavaScript).
6. **Desafio**: no painel, mostre "Material mais emprestado" usando `groupBy` em `itemEmprestimo` com `orderBy: { _sum: { quantidade: "desc" } }` e `take: 1`.
