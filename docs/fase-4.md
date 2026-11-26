# Fase 4 · Login e empresas

Cada empresa agora tem seus usuários, e **cada uma só enxerga os próprios dados**.

| Tela                                  | O que faz                                                         |
| ------------------------------------- | ----------------------------------------------------------------- |
| `/cadastro`                           | cria a empresa + o primeiro usuário (admin) e já entra            |
| `/login`                              | entra com e-mail e senha; volta pra página que você tentava abrir |
| Menu (embaixo, ou no topo no celular) | mostra quem está logado e a empresa; botão **Sair**               |

Logins do seed (`npm run db:seed`), só pra desenvolvimento:

| E-mail                | Senha       | Empresa                                             |
| --------------------- | ----------- | --------------------------------------------------- |
| `admin@exemplo.com`   | `retira123` | Construtora Exemplo (dados completos)               |
| `oficina@exemplo.com` | `retira123` | Oficina do Zé (1 material, pra testar o isolamento) |

> **Depois de uma migration, reinicie o `npm run dev`.** O Prisma Client fica guardado em `globalThis` (fase 2) e o servidor continua com a versão antiga, sem a tabela nova. Foi o erro `Cannot read properties of undefined (reading 'findUnique')` que apareceu durante a construção desta fase.

## Por que fizemos à mão (e não com biblioteca)

O plano era usar Auth.js, mas a versão para o App Router ainda está em **beta**. Fizemos seguindo o guia oficial do Next, com sessão no banco. São poucos arquivos e cada um mostra uma peça que toda biblioteca de login (e o Spring Security, no Java) faz por baixo.

## As peças

```
Navegador                         proxy.ts                    Servidor (páginas e actions)
cookie "retira_sessao"  ───────▶  tem cookie?   ──── sim ───▶ empresaAtualId()
(token aleatório)                  não → /login                 └ lerSessao(): hash do token → tabela sessoes
                                                                   não achou / expirou → /login
```

### 1. Senha → hash (`src/lib/senha.ts`)

- A senha **nunca** é salva. Salvamos `scrypt$<sal>$<hash>`.
- **scrypt** é lento e gasta memória de propósito: testar milhões de senhas fica caro.
- **Sal** aleatório por usuário: mesma senha, hashes diferentes.
- **`timingSafeEqual`**: compara sempre no mesmo tempo (um `===` "vaza" informação pelo tempo de resposta).
- Vem no próprio Node (`node:crypto`), sem instalar nada.

### 2. Sessão no banco (`src/lib/sessao.ts` + tabela `sessoes`)

- Ao entrar: sorteia um **token** (32 bytes) → vai no cookie. No banco vai o **sha256 do token**. Quem copiar o banco não consegue montar um cookie.
- Cookie com `httpOnly` (JavaScript da página não lê — protege de XSS), `sameSite: "lax"` (não vai em POST vindo de outro site — protege de CSRF), `secure` em produção (só HTTPS) e validade de 30 dias.
- **Sair** apaga a linha no banco e o cookie. Como a sessão está no banco, dá pra derrubar um login de qualquer lugar (ex.: "sair de todos os dispositivos" — exercício 4).
- `lerSessao` usa o `cache` do React: várias consultas na mesma página = uma leitura da sessão.

### 3. Proxy (`src/proxy.ts`) — a checagem rápida

No Next 16, o antigo `middleware.ts` se chama **`proxy.ts`**. Ele roda antes de toda página do `matcher`:

- sem cookie → `/login?de=/a-pagina`
- com cookie em `/login` ou `/cadastro` → `/painel`

Ele **não consulta o banco** (roda em toda requisição e precisa ser leve). Por isso é só "otimista": um cookie velho passa pelo proxy, mas é barrado no passo seguinte.

### 4. A checagem de verdade — `empresaAtualId()` (`src/lib/empresa-atual.ts`)

Lembra que desde a fase 2 toda consulta e toda action chamam `empresaAtualId()`? Agora ela lê a sessão e, se não houver, faz `redirect("/login")`. **Trocar uma função protegeu o sistema inteiro** — esse é o padrão _Data Access Layer_ do guia do Next.

O teste: logado como Oficina, abrir o endereço de um material da Construtora → "Não encontramos esta página". Não é a tela que esconde: a consulta tem `where: { id, empresaId }` e simplesmente não acha.

### 5. Cadastro numa transação (`src/services/autenticacao.service.ts`)

`prisma.$transaction` cria a empresa **e** o usuário: ou as duas coisas ficam gravadas, ou nenhuma. Antes, conferimos e-mail e CNPJ pra dar a mensagem no campo certo; o `@unique` do banco segura o caso raro de dois cadastros ao mesmo tempo.

### 6. Cuidados de segurança que aparecem no código

| Cuidado                                                                                            | Onde                                                    |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Mesma mensagem pra "e-mail não existe" e "senha errada" (ninguém descobre quais e-mails têm conta) | `autenticar()`                                          |
| A senha nunca volta pro navegador, nem em caso de erro                                             | `entrarAction`, `cadastrarAction` (`valores` sem senha) |
| `?de=` só aceita caminho interno (`/algo`), senão vira um _open redirect_ pra site falso           | `destinoSeguro()`                                       |
| `senhaHash` nunca sai do banco: a sessão usa `select` só com o necessário                          | `lerSessao()`                                           |
| E-mail sempre em minúsculas (`Ana@X.com` = `ana@x.com`)                                            | `src/schemas/autenticacao.ts`                           |

### 7. Next 16 + Cache Components + login

- Ler o cookie é dado "da requisição": tem que estar dentro de um `<Suspense>`. Por isso o **layout não faz `await`** na sessão: só o `<UsuarioMenu>` lê, dentro do seu próprio Suspense. A barra lateral aparece na hora e o nome do usuário chega logo depois.
- A página de login lê `?de=` com `useSearchParams()` → também dentro de `<Suspense>`.
- `/login` e `/cadastro` saem estáticas no build (○): não dependem de quem está acessando.
- O aviso com o login de exemplo só aparece fora de produção (`process.env.NODE_ENV !== "production"`).

### 8. Route groups de novo

`(auth)` agrupa login e cadastro com uma moldura própria (logo + cartão), sem a barra lateral do `(app)`. Nenhum dos dois nomes aparece na URL.

## Exercícios

1. **Ver a sessão no banco**: entre, abra `npm run db:studio`, tabela `sessoes`. Compare o `id` com o valor do cookie `retira_sessao` (DevTools → Application → Cookies). São diferentes: um é o hash do outro.
2. **Derrubar uma sessão**: com o sistema aberto, apague a linha da sessão no Studio e recarregue a página.
3. **Prova do isolamento**: logado como Oficina, tente **editar** um material da Construtora pela URL (`/materiais/<id>/editar`).
4. **"Sair de todos os dispositivos"**: uma action que apaga todas as sessões do usuário logado (`deleteMany({ where: { usuarioId } })`) e um botão no menu.
5. **Trocar a senha**: página `/conta` com senha atual + nova (Zod com `refine` pra confirmar) e um service que confere a atual com `conferirSenha` antes de gravar.
6. **Desafio — limitar tentativas**: depois de 5 senhas erradas para o mesmo e-mail em 15 minutos, recusar por um tempo. (Dica: uma tabela `tentativas_login` com e-mail e data.)
