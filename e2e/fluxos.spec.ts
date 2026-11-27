import { expect, test, type Page } from "@playwright/test";

// Os testes procuram os elementos como uma PESSOA procuraria: pelo rótulo do campo,
// pelo texto do botão, pelo título. Se um teste não acha "Entrar", provavelmente
// quem usa o sistema também teria dificuldade (e é um bom sinal de acessibilidade).

async function entrar(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("retira123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/painel/);
}

test("sem login, o sistema manda pro login e depois volta pra página pedida", async ({
  page,
}) => {
  await page.goto("/materiais");
  await expect(page).toHaveURL(/\/login\?de=%2Fmateriais/);

  await page.getByLabel("E-mail").fill("admin@exemplo.com");
  await page.getByLabel("Senha").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();

  await page.getByLabel("Senha").fill("retira123");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/materiais$/);
  await expect(page.getByRole("heading", { name: "Materiais" })).toBeVisible();
});

test("retirada com dois itens, devolução parcial e devolução do resto", async ({
  page,
}) => {
  await entrar(page, "admin@exemplo.com");
  await page.goto("/emprestimos/novo");

  await page
    .getByLabel("Quem está retirando")
    .selectOption({ label: "Marcos Pereira · Obras" });
  await page
    .getByLabel("Material 1")
    .selectOption({ label: "Rádio comunicador · 6 disp." });
  await page.getByLabel("Quantidade 1").fill("2");
  await page.getByRole("button", { name: "Adicionar item" }).click();
  await page
    .getByLabel("Material 2")
    .selectOption({ label: "Trena 5 m · 6 disp." });

  // Pedir mais do que há: o navegador barra antes de ir ao servidor.
  await page.getByLabel("Quantidade 2").fill("9");
  await page.getByRole("button", { name: "Registrar retirada" }).click();
  await expect(page.getByText("Só 6 disp.")).toBeVisible();

  await page.getByLabel("Quantidade 2").fill("1");
  await page.getByRole("button", { name: "Registrar retirada" }).click();

  await expect(
    page.getByRole("heading", { name: "Retirada de Marcos Pereira" }),
  ).toBeVisible();
  await expect(page.getByText("Pendentes (2)")).toBeVisible();

  // Devolução parcial: desmarca a trena e devolve só os rádios.
  await page.getByRole("checkbox", { name: /Trena 5 m/ }).uncheck();
  await page.getByRole("button", { name: "Registrar devolução" }).click();
  await expect(page.getByText("Devolução parcial registrada.")).toBeVisible();
  await expect(page.getByText("Pendentes (1)")).toBeVisible();
  await expect(page.getByText("Parcial", { exact: true })).toBeVisible();

  // Devolve o resto.
  await page.getByRole("button", { name: "Registrar devolução" }).click();
  await expect(page.getByText("Devolução concluída.")).toBeVisible();
  await expect(page.getByText("Devolvidos (2)")).toBeVisible();
});

test("uma empresa não vê os dados da outra", async ({ page }) => {
  // Pega o endereço de um material da Construtora...
  await entrar(page, "admin@exemplo.com");
  await page.goto("/materiais");
  const linkFuradeira = page.getByRole("link", {
    name: "Furadeira Bosch GSB 13",
  });
  const enderecoDaFuradeira = await linkFuradeira.getAttribute("href");
  expect(enderecoDaFuradeira).toMatch(/^\/materiais\//);

  // ...sai e entra como a Oficina.
  await page.getByRole("button", { name: "Sair" }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await entrar(page, "oficina@exemplo.com");

  await page.goto("/materiais");
  await expect(page.getByText("1 materiais cadastrados")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Furadeira Bosch GSB 13" }),
  ).toHaveCount(0);

  // Nem abrindo o endereço direto.
  await page.goto(enderecoDaFuradeira!);
  await expect(page.getByText("Não encontramos esta página")).toBeVisible();
});
