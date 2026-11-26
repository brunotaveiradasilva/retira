import { NextResponse, type NextRequest } from "next/server";

// PROXY (no Next 15 se chamava "middleware"): roda ANTES de qualquer página.
//
// Aqui fazemos só a checagem RÁPIDA e "otimista": tem o cookie de sessão ou não?
// - Sem cookie tentando abrir o sistema → manda pro /login (lembrando pra onde ia).
// - Com cookie abrindo /login ou /cadastro → manda pro /painel.
//
// A checagem DE VERDADE (a sessão existe no banco? expirou?) fica no servidor, em
// empresaAtualId() / usuarioLogado(), chamada por toda consulta e toda action.
// O proxy não consulta o banco: ele roda em toda requisição e precisa ser leve.

// Não importamos de "@/lib/sessao" porque aquele arquivo usa o Prisma (server-only).
const NOME_DO_COOKIE = "retira_sessao";

const PAGINAS_DE_ENTRADA = ["/login", "/cadastro"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const temSessao = request.cookies.has(NOME_DO_COOKIE);
  const ehEntrada = PAGINAS_DE_ENTRADA.includes(pathname);

  if (!temSessao && !ehEntrada) {
    const url = new URL("/login", request.url);
    url.searchParams.set("de", pathname + search);
    return NextResponse.redirect(url);
  }

  if (temSessao && ehEntrada) {
    return NextResponse.redirect(new URL("/painel", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Só as rotas do sistema e as de entrada. A página inicial (/), o ícone e os
  // arquivos do Next ficam de fora.
  matcher: [
    "/painel/:path*",
    "/materiais/:path*",
    "/tipos/:path*",
    "/colaboradores/:path*",
    "/emprestimos/:path*",
    "/login",
    "/cadastro",
  ],
};
