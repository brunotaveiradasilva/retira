import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Vitest: roda os testes de UNIDADE (funções puras, sem navegador e sem banco).
// Os testes de ponta a ponta ficam em e2e/ e rodam com o Playwright.
export default defineConfig({
  resolve: {
    // O mesmo atalho "@/..." do tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"], // e2e/ fica com o Playwright
    environment: "node",
    // Fuso fixo nos testes: o resultado não pode depender do computador.
    env: { TZ: "UTC" },
  },
});
