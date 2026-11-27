import { describe, expect, it } from "vitest";
import {
  diasDeAtraso,
  estaAberto,
  estaAtrasado,
  quantidadeDisponivel,
  unidadesPendentes,
  venceEmBreve,
} from "./regras";

// Um teste de unidade: chama a função com dados conhecidos e confere a resposta.
//   describe → agrupa testes de um assunto
//   it       → um caso ("deveria fazer tal coisa")
//   expect   → a conferência (se falhar, o teste fica vermelho)
//
// Como regras.ts é PURO (não fala com o banco), basta montar objetos simples.
// Foi pra isso que usamos Pick<...> nas assinaturas lá na fase 2.

const hoje = new Date("2026-11-27T12:00:00Z");
const dia = (deslocamento: number) =>
  new Date(hoje.getTime() + deslocamento * 24 * 60 * 60 * 1000);

describe("estaAberto", () => {
  it("aberto e parcial estão abertos; devolvido não", () => {
    expect(estaAberto({ status: "ABERTO" })).toBe(true);
    expect(estaAberto({ status: "PARCIAL" })).toBe(true);
    expect(estaAberto({ status: "DEVOLVIDO" })).toBe(false);
  });
});

describe("estaAtrasado e diasDeAtraso", () => {
  it("prazo no passado e ainda aberto = atrasado", () => {
    const emprestimo = {
      status: "ABERTO" as const,
      previsaoDevolucao: dia(-3),
    };
    expect(estaAtrasado(emprestimo, hoje)).toBe(true);
    expect(diasDeAtraso(emprestimo, hoje)).toBe(3);
  });

  it("prazo no futuro não está atrasado", () => {
    const emprestimo = { status: "ABERTO" as const, previsaoDevolucao: dia(2) };
    expect(estaAtrasado(emprestimo, hoje)).toBe(false);
    expect(diasDeAtraso(emprestimo, hoje)).toBe(0);
  });

  it("devolvido nunca está atrasado, mesmo com prazo vencido", () => {
    const emprestimo = {
      status: "DEVOLVIDO" as const,
      previsaoDevolucao: dia(-10),
    };
    expect(estaAtrasado(emprestimo, hoje)).toBe(false);
  });

  it("sem prazo não atrasa", () => {
    expect(
      estaAtrasado({ status: "ABERTO", previsaoDevolucao: null }, hoje),
    ).toBe(false);
  });

  it("poucas horas de atraso já contam como 1 dia", () => {
    const umaHoraAtras = new Date(hoje.getTime() - 60 * 60 * 1000);
    expect(
      diasDeAtraso({ status: "ABERTO", previsaoDevolucao: umaHoraAtras }, hoje),
    ).toBe(1);
  });
});

describe("venceEmBreve", () => {
  it("vence dentro da janela", () => {
    expect(
      venceEmBreve({ status: "ABERTO", previsaoDevolucao: dia(2) }, hoje, 3),
    ).toBe(true);
  });

  it("fora da janela ou já vencido não conta", () => {
    expect(
      venceEmBreve({ status: "ABERTO", previsaoDevolucao: dia(5) }, hoje, 3),
    ).toBe(false);
    expect(
      venceEmBreve({ status: "ABERTO", previsaoDevolucao: dia(-1) }, hoje, 3),
    ).toBe(false);
  });
});

describe("unidadesPendentes", () => {
  const emprestimos = [
    {
      status: "PARCIAL" as const,
      itens: [
        { materialId: "trena", quantidade: 2, devolvidoEm: null },
        { materialId: "radio", quantidade: 3, devolvidoEm: dia(-1) }, // já voltou
      ],
    },
    {
      status: "DEVOLVIDO" as const, // fechado: não conta
      itens: [{ materialId: "trena", quantidade: 5, devolvidoEm: null }],
    },
    {
      status: "ABERTO" as const,
      itens: [{ materialId: "trena", quantidade: 1, devolvidoEm: null }],
    },
  ];

  it("soma só o que ainda não voltou, de empréstimos abertos", () => {
    expect(unidadesPendentes(emprestimos)).toBe(3);
  });

  it("filtra por material", () => {
    expect(unidadesPendentes(emprestimos, "trena")).toBe(3);
    expect(unidadesPendentes(emprestimos, "radio")).toBe(0);
  });
});

describe("quantidadeDisponivel", () => {
  it("total menos o que está fora", () => {
    expect(quantidadeDisponivel({ estado: "BOM", quantidade: 10 }, 4)).toBe(6);
  });

  it("nunca negativo", () => {
    expect(quantidadeDisponivel({ estado: "BOM", quantidade: 2 }, 5)).toBe(0);
  });

  it("material que não está bom não tem nada disponível", () => {
    expect(
      quantidadeDisponivel({ estado: "MANUTENCAO", quantidade: 10 }, 0),
    ).toBe(0);
  });
});
