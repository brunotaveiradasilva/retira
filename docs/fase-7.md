# Fase 7 · Testes, CI e deploy

Até aqui, quem garantia que tudo funcionava era a gente clicando. Agora:

|                                          | O que é                                               | Como rodar                                                   |
| ---------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------ |
| **Testes de unidade** (Vitest)           | funções puras: regras, schemas, filtros, senha, datas | `npm test` (ou `npm run test:watch` enquanto programa)       |
| **Testes de ponta a ponta** (Playwright) | navegador de verdade fazendo os fluxos principais     | `npm run test:e2e` ⚠️ roda o `db:seed` (apaga o banco local) |
| **CI** (GitHub Actions)                  | o GitHub roda tudo isso sozinho a cada PR             | automático; veja a aba **Checks** do PR                      |
| **Deploy** (Vercel + Neon)               | o Retira no ar com link público                       | ver a seção no fim                                           |

## 1. Testes de unidade — Vitest

```ts
describe("quantidadeDisponivel", () => {
  it("material que não está bom não tem nada disponível", () => {
    expect(
      quantidadeDisponivel({ estado: "MANUTENCAO", quantidade: 10 }, 0),
    ).toBe(0);
  });
});
```

- `describe` agrupa, `it` é um caso, `expect(...).toBe(...)` confere.
- Arquivos `*.test.ts` ao lado do código (`src/lib/regras.test.ts`, `src/schemas/schemas.test.ts`, `src/lib/utilitarios.test.ts`): 36 testes.
- **Por que deu pra testar fácil?** Porque desde a fase 2 as regras ficam em funções **puras** (sem banco, sem React) e usam `Pick<...>`: o teste monta um objeto simples. Código fácil de testar costuma ser código bem separado.
- Testar schemas = testar a porta de entrada: o que passa, o que é barrado, em qual campo cai o erro, como o dado sai limpo.
- `vitest.config.mts` repete o atalho `@/` do tsconfig e fixa `TZ=UTC` (o resultado não pode depender do seu computador).

## 2. Testes de ponta a ponta — Playwright

`e2e/fluxos.spec.ts` abre o Chromium e faz, como uma pessoa:

1. Abrir `/materiais` sem login → login → senha errada → senha certa → volta pra `/materiais`.
2. Retirada com 2 itens (incluindo a quantidade acima do disponível sendo barrada), devolução parcial, devolução do resto.
3. Logado como Oficina, não vê nem consegue abrir o material da Construtora.

- Os elementos são achados **como uma pessoa acharia**: `getByLabel("E-mail")`, `getByRole("button", { name: "Entrar" })`. Se o teste não acha, quem usa o sistema provavelmente também teria dificuldade (e leitores de tela também).
- `e2e/preparar-banco.ts` (globalSetup) roda o seed antes: os testes partem de um estado conhecido.
- `webServer` no `playwright.config.ts` sobe o sistema sozinho (reaproveita o `npm run dev` se já estiver rodando).

## 3. CI — `.github/workflows/ci.yml`

A cada push na `main` e a cada PR, duas máquinas Linux limpas:

| Job           | Passos                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| **verificar** | `npm ci` → lint → typecheck → format:check → testes de unidade → build                                           |
| **e2e**       | sobe um **Postgres de verdade** (`services`) → `prisma migrate deploy` → instala o Chromium → build → Playwright |

Se qualquer passo falhar, o PR mostra ❌ e dá pra ver o log. No e2e, o relatório do Playwright (com o "filme" do teste) fica pra baixar.

`prisma migrate deploy` (e não `migrate dev`): **aplica** as migrations que já existem, sem criar novas nem resetar nada. É o comando de produção.

## 4. Fuso horário — `src/lib/datas.ts`

O servidor da Vercel roda em **UTC** (3 horas à frente de Brasília). Sem cuidado, "devolver até 03/12" venceria às 20:59, e um empréstimo das 22h apareceria com a data do dia seguinte. Agora:

- `fimDoDia("2026-12-03")` → 23:59:59 **de Brasília** (`-03:00`);
- `formatarData` e `paraInputDate` usam `timeZone: "America/Sao_Paulo"`;
- um teste roda com `TZ=UTC` e confere justamente o caso das 22h.

## 5. Ajustes de ambiente

- `.gitattributes` com `eol=lf`: acabaram os avisos "LF will be replaced by CRLF".
- `@types/node` atualizado pra 24 (o Vitest 5 pedia; seu Node já é o 24).
- `npm run typecheck` agora roda `next typegen` antes do `tsc` (no CI não há `.next/`).

## 6. Deploy — Vercel + Neon

**No ar: https://retira-nine.vercel.app**

```
GitHub (main) ──push──▶ Vercel (build em São Paulo)
                         ├─ npm install → prisma generate
                         ├─ prisma migrate deploy ──▶ Neon (Postgres, São Paulo) via DIRECT_URL
                         └─ next build
                        site no ar ──consultas──▶ Neon via DATABASE_URL (pooler)
```

### Como foi feito

1. **Neon** (neon.tech): projeto `retira`, região **AWS South America East 1 (São Paulo)**, plano gratuito.
2. **Vercel** (vercel.com): conta Hobby (gratuita) e o app da Vercel instalado no GitHub com acesso **só** ao repositório `retira`.
3. **Importar** `brunotaveiradasilva/retira` na Vercel (framework Next.js detectado).
4. **Variáveis de ambiente** (Settings → Environment Variables), coladas à mão a partir do botão **Connect** do Neon:

   | Nome           | Valor                                                        | Usada por                         |
   | -------------- | ------------------------------------------------------------ | --------------------------------- |
   | `DATABASE_URL` | URL **com** "Connection pooling" (tem `-pooler` no endereço) | o site, a cada requisição         |
   | `DIRECT_URL`   | URL **sem** pooling                                          | `prisma migrate deploy`, no build |

   Marcadas como **Sensitive**: depois de salvas, nem você consegue ver o valor (só editar).

5. **Deploy**. O `vercel.json` roda `scripts/build-vercel.mjs` (migrations **só em produção**, veja abaixo) e coloca as funções em `gru1` (São Paulo, perto do banco).

### O que deu errado no caminho (e o que ensina)

- **`Connection url is empty`** no primeiro deploy: a `DIRECT_URL` ficou salva **vazia**. No `prisma.config.ts` estava `DIRECT_URL ?? DATABASE_URL`, e o `??` só troca quando o valor é `null`/`undefined` — string vazia passa. Trocamos por `||`, que também pula `""`. **`??` pula só `null`/`undefined`; `||` pula também `""`, `0` e `false`.**
- **Testar antes de ir pra produção**: com o PR ainda aberto, refizemos o deploy de **prévia** (preview) com as variáveis corrigidas. Ficou "Ready", e só então fizemos o merge.
- **O merge na `main` não disparou deploy** da primeira vez; criamos manualmente em Deployments → ⋯ → Create Deployment → `main`.
- **A prévia de um PR alterou o banco de produção.** As prévias usam as mesmas variáveis (e o mesmo banco) da produção, e o build rodava `prisma migrate deploy` sempre. No PR que removeu os tipos, a migration apagou a tabela **antes do merge**, e o site no ar (código antigo) ficou alguns minutos procurando uma coluna que não existia mais. Correção: `scripts/build-vercel.mjs` olha a variável `VERCEL_ENV` que a Vercel fornece (`production` / `preview`) e só migra em produção.

  ```js
  if (process.env.VERCEL_ENV === "production")
    rodar("npx prisma migrate deploy");
  rodar("npx next build");
  ```

  Efeito colateral aceito: a prévia de um PR que **muda o schema** roda com o banco antigo e pode dar erro nas telas afetadas. Próximo passo possível: dar às prévias um banco **separado** (o Neon permite criar uma _branch_ do banco só pra elas).

### Cuidados em produção

- O banco de produção começa **vazio**: cada empresa se cadastra em `/cadastro`.
- **Nunca rode `npm run db:seed` apontando pra produção**: ele **apaga tudo** antes de recriar os exemplos.
- Mudou o schema? A migration criada localmente (`npm run db:migrate`) vai pro git e o **deploy de produção** (depois do merge) aplica com `migrate deploy`. Nada de rodar `migrate dev` em produção.
- **As prévias ainda leem e gravam no banco de produção** (só não migram). Não use a prévia de um PR pra testar cadastros falsos.
- A senha do banco mora só nas variáveis da Vercel e no Neon. Se vazar, gere outra no Neon (Roles → Reset password) e edite as duas variáveis.

## Exercícios

1. **Quebre de propósito**: mude `quantidadeDisponivel` pra ignorar o estado e rode `npm test`. Veja qual teste fica vermelho e a mensagem.
2. **Teste novo de unidade**: `diasDeAtraso` com prazo exatamente agora (0 ms de atraso).
3. **Teste novo e2e**: cadastrar um material e encontrá-lo pela busca.
4. **TDD** (escrever o teste antes): uma regra `podeExcluirColaborador(emprestimos)` em `regras.ts` — escreva o teste, veja falhar, implemente, veja passar.
5. **Modo interativo**: `npx playwright test --ui` e assista os testes rodando passo a passo.
6. **Desafio — CI vermelho**: abra um PR com um erro de lint de propósito e veja o CI barrar.
