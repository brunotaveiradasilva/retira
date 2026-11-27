import { describe, expect, it } from "vitest";
import { fimDoDia, paraInputDate } from "./datas";
import { lerOpcao, lerPagina, lerTexto, urlCom } from "./filtros";
import { formatarData, iniciais } from "./formatar";
import { conferirSenha, gerarHashDeSenha } from "./senha";

describe("filtros da URL", () => {
  it("lerTexto limpa espaços, pega o primeiro de uma lista e ignora vazio", () => {
    expect(lerTexto("  fur ")).toBe("fur");
    expect(lerTexto(["a", "b"])).toBe("a");
    expect(lerTexto("   ")).toBeUndefined();
    expect(lerTexto(undefined)).toBeUndefined();
  });

  it("lerPagina só aceita inteiro positivo", () => {
    expect(lerPagina("3")).toBe(3);
    expect(lerPagina("abc")).toBe(1);
    expect(lerPagina("-2")).toBe(1);
    expect(lerPagina("1.5")).toBe(1);
  });

  it("lerOpcao só aceita valores da lista", () => {
    const opcoes = ["abertos", "todos"] as const;
    expect(lerOpcao("todos", opcoes, "abertos")).toBe("todos");
    expect(lerOpcao("hackear", opcoes, "abertos")).toBe("abertos");
    expect(lerOpcao("hackear", opcoes)).toBeUndefined();
  });

  it("urlCom troca um parâmetro e mantém os outros", () => {
    expect(
      urlCom(
        "/emprestimos",
        { situacao: "todos", busca: "ana", pagina: "3" },
        {
          pagina: undefined,
        },
      ),
    ).toBe("/emprestimos?situacao=todos&busca=ana");
    expect(urlCom("/materiais", {}, {})).toBe("/materiais");
  });
});

describe("datas no fuso de Brasília", () => {
  // Os testes rodam com TZ=UTC (vitest.config.ts), como o servidor da Vercel.

  it("o prazo vale até 23:59 de Brasília, que é 02:59 do dia seguinte em UTC", () => {
    expect(fimDoDia("2026-12-03").toISOString()).toBe(
      "2026-12-04T02:59:59.000Z",
    );
  });

  it("22h de Brasília ainda é o mesmo dia (em UTC já seria o dia seguinte)", () => {
    const vinteDuasHoras = new Date("2026-12-03T01:00:00Z"); // 02/12 22:00 em Brasília
    expect(paraInputDate(vinteDuasHoras)).toBe("2026-12-02");
    expect(formatarData(vinteDuasHoras)).toBe("02/12/2026");
  });

  it("data vazia vira travessão", () => {
    expect(formatarData(null)).toBe("—");
  });
});

describe("iniciais", () => {
  it("primeira e última palavra", () => {
    expect(iniciais("Ana Paula Souza")).toBe("AS");
    expect(iniciais("Juliana")).toBe("J");
  });
});

describe("senha", () => {
  it("o hash não contém a senha e confere só com a senha certa", async () => {
    const hash = await gerarHashDeSenha("retira123");
    expect(hash).not.toContain("retira123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await conferirSenha("retira123", hash)).toBe(true);
    expect(await conferirSenha("retira124", hash)).toBe(false);
  });

  it("a mesma senha gera hashes diferentes (sal aleatório)", async () => {
    const [a, b] = await Promise.all([
      gerarHashDeSenha("igual"),
      gerarHashDeSenha("igual"),
    ]);
    expect(a).not.toBe(b);
  });

  it("hash em formato estranho não confere (e não quebra)", async () => {
    expect(await conferirSenha("x", "lixo")).toBe(false);
  });
});
