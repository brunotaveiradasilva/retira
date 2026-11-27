import { NextResponse, type NextRequest } from "next/server";
import { NOME_DO_COOKIE } from "@/lib/sessao";

// ROUTE HANDLER (route.ts): uma URL que responde com código, sem página.
// Aqui é o único jeito simples de APAGAR o cookie quando a sessão não vale mais:
// Server Components só leem cookies, não podem alterá-los.
//
// Por que isso importa: com um cookie velho (sessão apagada do banco ou expirada),
// o proxy achava que a pessoa estava logada e mandava /login → /painel, e o /painel
// mandava de volta pro /login... um loop infinito. Agora:
//   página sem sessão válida → /sessao-expirada → apaga o cookie → /login
export function GET(request: NextRequest) {
  const destino = new URL("/login", request.url);
  const de = request.nextUrl.searchParams.get("de");
  if (de && de.startsWith("/") && !de.startsWith("//")) {
    destino.searchParams.set("de", de);
  }

  const resposta = NextResponse.redirect(destino);
  resposta.cookies.delete(NOME_DO_COOKIE);
  return resposta;
}
