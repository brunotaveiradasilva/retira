import { defineConfig, devices } from "@playwright/test";

// Playwright: testes de PONTA A PONTA. Abre um navegador de verdade (Chromium),
// clica e digita como uma pessoa, contra o sistema rodando com banco de verdade.
//
// ATENÇÃO: antes de rodar, o globalSetup executa o `db:seed`, que APAGA o banco
// e recria os dados de exemplo. Os testes precisam partir de um estado conhecido.

const noCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/preparar-banco.ts",
  fullyParallel: false, // os testes mexem no mesmo banco: um de cada vez
  workers: 1,
  retries: noCI ? 1 : 0,
  reporter: noCI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "on-first-retry", // se falhar no CI, grava um "filme" pra investigar
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Sobe o sistema sozinho. Localmente reaproveita o `npm run dev` se já estiver rodando;
  // no CI usa o build de produção (`npm run start`).
  webServer: {
    command: noCI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !noCI,
    timeout: 120_000,
  },
});
