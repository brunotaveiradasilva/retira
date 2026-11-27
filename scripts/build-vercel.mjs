// Build na Vercel: aplica as migrations SÓ no deploy de produção.
//
// Por quê: as prévias de PR (Preview) usam o mesmo banco da produção. Antes, todo build
// rodava `prisma migrate deploy`, então abrir um PR já alterava o banco real — antes de
// revisar e antes do merge. Foi o que aconteceu no PR que removeu os tipos.
//
// A Vercel informa o ambiente em VERCEL_ENV: "production", "preview" ou "development".
// Consequência aceita: a prévia de um PR que MUDA o schema roda com o banco antigo e
// pode dar erro nas telas afetadas. O código só encontra o banco novo depois do merge.

import { execSync } from "node:child_process";

const rodar = (comando) => execSync(comando, { stdio: "inherit" });
const ambiente = process.env.VERCEL_ENV ?? "local";

if (ambiente === "production") {
  console.log("▶ Produção: aplicando migrations (prisma migrate deploy)");
  rodar("npx prisma migrate deploy");
} else {
  console.log(
    `▶ Ambiente "${ambiente}": migrations NÃO aplicadas (só em produção).`,
  );
}

rodar("npx next build");
