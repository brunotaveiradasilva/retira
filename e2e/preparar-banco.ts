import { execSync } from "node:child_process";

// Roda UMA vez antes de todos os testes: recria os dados de exemplo.
export default function prepararBanco() {
  execSync("npm run db:seed", { stdio: "inherit" });
}
