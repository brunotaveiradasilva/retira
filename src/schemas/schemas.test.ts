import { describe, expect, it } from "vitest";
import { cadastroSchema, loginSchema } from "./autenticacao";
import { colaboradorSchema } from "./colaborador";
import { retiradaSchema } from "./emprestimo";
import { materialSchema } from "./material";

// Testar schemas é testar a "porta de entrada": o que passa, o que é barrado e como
// o dado sai limpo. safeParse não lança erro: devolve { success, data | error }.

/** As mensagens de erro de um campo (pra conferir que o erro caiu no lugar certo). */
function errosDe(
  resultado: {
    success: boolean;
    error?: { issues: { path: PropertyKey[]; message: string }[] };
  },
  campo: string,
) {
  return (resultado.error?.issues ?? [])
    .filter((issue) => issue.path[0] === campo)
    .map((issue) => issue.message);
}

describe("materialSchema", () => {
  const valido = {
    nome: "  Furadeira  ",
    codigo: "",
    controle: "UNITARIO",
    quantidade: 1,
    estado: "BOM",
  };

  it("limpa espaços e transforma código vazio em null", () => {
    const resultado = materialSchema.parse(valido);
    expect(resultado.nome).toBe("Furadeira");
    expect(resultado.codigo).toBeNull();
  });

  it("aceita a própria saída (o schema roda no navegador e de novo no servidor)", () => {
    const primeira = materialSchema.parse(valido);
    expect(materialSchema.safeParse(primeira).success).toBe(true);
  });

  it("unitário com quantidade diferente de 1 é recusado no campo quantidade", () => {
    const resultado = materialSchema.safeParse({ ...valido, quantidade: 3 });
    expect(resultado.success).toBe(false);
    expect(errosDe(resultado, "quantidade")).toContain(
      "Material unitário tem sempre quantidade 1",
    );
  });

  it("por quantidade pode ter várias unidades", () => {
    expect(
      materialSchema.safeParse({
        ...valido,
        controle: "QUANTIDADE",
        quantidade: 30,
      }).success,
    ).toBe(true);
  });

  it("estado fora da lista é recusado", () => {
    expect(
      materialSchema.safeParse({ ...valido, estado: "QUEBRADO" }).success,
    ).toBe(false);
  });
});

describe("colaboradorSchema", () => {
  it("telefone sem DDD é recusado; vazio é aceito", () => {
    const base = { nome: "Ana Souza", matricula: "", setor: "" };
    expect(
      colaboradorSchema.safeParse({ ...base, telefone: "9999" }).success,
    ).toBe(false);
    expect(
      colaboradorSchema.parse({ ...base, telefone: "" }).telefone,
    ).toBeNull();
    expect(
      colaboradorSchema.safeParse({ ...base, telefone: "(51) 99999-0000" })
        .success,
    ).toBe(true);
  });
});

describe("retiradaSchema", () => {
  const base = {
    colaboradorId: "c1",
    previsaoDevolucao: "2026-12-03",
    observacao: "",
    itens: [{ materialId: "m1", quantidade: 1 }],
  };

  it("lista vazia é recusada", () => {
    expect(retiradaSchema.safeParse({ ...base, itens: [] }).success).toBe(
      false,
    );
  });

  it("material repetido na lista é recusado", () => {
    const resultado = retiradaSchema.safeParse({
      ...base,
      itens: [
        { materialId: "m1", quantidade: 1 },
        { materialId: "m1", quantidade: 2 },
      ],
    });
    expect(errosDe(resultado, "itens")).toContain(
      "Há um material repetido na lista",
    );
  });

  it("prazo vazio vira null", () => {
    expect(
      retiradaSchema.parse({ ...base, previsaoDevolucao: "" })
        .previsaoDevolucao,
    ).toBeNull();
  });
});

describe("autenticação", () => {
  it("e-mail sai em minúsculas e sem espaços", () => {
    expect(
      loginSchema.parse({ email: "  Ana@Empresa.COM ", senha: "x" }).email,
    ).toBe("ana@empresa.com");
  });

  it("senhas diferentes no cadastro dão erro na confirmação", () => {
    const resultado = cadastroSchema.safeParse({
      empresaNome: "Teste",
      cnpj: "",
      nome: "Pessoa Teste",
      email: "a@b.com",
      senha: "12345678",
      confirmacao: "87654321",
    });
    expect(errosDe(resultado, "confirmacao")).toContain(
      "As senhas não são iguais",
    );
  });

  it("senha curta é recusada", () => {
    const resultado = cadastroSchema.safeParse({
      empresaNome: "Teste",
      cnpj: "",
      nome: "Pessoa Teste",
      email: "a@b.com",
      senha: "123",
      confirmacao: "123",
    });
    expect(errosDe(resultado, "senha")).toContain("Mínimo de 8 caracteres");
  });
});
