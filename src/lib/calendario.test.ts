import { describe, expect, it } from "vitest";
import {
  dentroDoPeriodo,
  lerMes,
  limitesDoMes,
  mesParaTexto,
  mesVizinho,
  periodoDoEmprestimo,
  semanasDoMes,
} from "./calendario";

const hoje = new Date("2026-11-27T15:00:00Z"); // 27/11/2026, meio-dia em Brasília

describe("mês da URL", () => {
  it("lê ?mes=2026-12 e cai no mês atual se for inválido", () => {
    expect(lerMes("2026-12", hoje)).toEqual({ ano: 2026, mes: 12 });
    expect(lerMes("2026-13", hoje)).toEqual({ ano: 2026, mes: 11 });
    expect(lerMes("abc", hoje)).toEqual({ ano: 2026, mes: 11 });
    expect(lerMes(undefined, hoje)).toEqual({ ano: 2026, mes: 11 });
  });

  it("vizinhos atravessam a virada do ano", () => {
    expect(mesVizinho({ ano: 2026, mes: 12 }, 1)).toEqual({
      ano: 2027,
      mes: 1,
    });
    expect(mesVizinho({ ano: 2026, mes: 1 }, -1)).toEqual({
      ano: 2025,
      mes: 12,
    });
    expect(mesParaTexto({ ano: 2027, mes: 1 })).toBe("2027-01");
  });
});

describe("grade do mês", () => {
  it("dezembro de 2026 começa numa terça: a grade começa no domingo 29/11", () => {
    const semanas = semanasDoMes({ ano: 2026, mes: 12 });
    expect(semanas[0][0]).toBe("2026-11-29");
    expect(semanas[0][2]).toBe("2026-12-01");
    expect(semanas.every((semana) => semana.length === 7)).toBe(true);
    expect(semanas.at(-1)?.at(-1)).toBe("2027-01-02");
  });

  it("limites do mês, inclusive fevereiro", () => {
    expect(limitesDoMes({ ano: 2026, mes: 2 })).toEqual({
      inicio: "2026-02-01",
      fim: "2026-02-28",
    });
  });
});

describe("período do empréstimo", () => {
  const brasilia = (d: string, h = "12:00") => new Date(`${d}T${h}:00-03:00`);

  it("aberto com prazo no futuro vai até o prazo", () => {
    expect(
      periodoDoEmprestimo(
        {
          status: "ABERTO",
          retiradoEm: brasilia("2026-11-25"),
          previsaoDevolucao: brasilia("2026-12-02", "23:59"),
          itens: [{ devolvidoEm: null }],
        },
        hoje,
      ),
    ).toEqual({ inicio: "2026-11-25", fim: "2026-12-02" });
  });

  it("atrasado continua até hoje", () => {
    expect(
      periodoDoEmprestimo(
        {
          status: "ABERTO",
          retiradoEm: brasilia("2026-11-10"),
          previsaoDevolucao: brasilia("2026-11-20", "23:59"),
          itens: [{ devolvidoEm: null }],
        },
        hoje,
      ).fim,
    ).toBe("2026-11-27");
  });

  it("devolvido vai até a última devolução", () => {
    expect(
      periodoDoEmprestimo(
        {
          status: "DEVOLVIDO",
          retiradoEm: brasilia("2026-11-01"),
          previsaoDevolucao: brasilia("2026-11-10", "23:59"),
          itens: [
            { devolvidoEm: brasilia("2026-11-05") },
            { devolvidoEm: brasilia("2026-11-08") },
          ],
        },
        hoje,
      ),
    ).toEqual({ inicio: "2026-11-01", fim: "2026-11-08" });
  });

  it("retirada às 22h de Brasília conta no dia certo (em UTC já seria o dia seguinte)", () => {
    expect(
      periodoDoEmprestimo(
        {
          status: "ABERTO",
          retiradoEm: brasilia("2026-11-26", "22:00"),
          previsaoDevolucao: null,
          itens: [{ devolvidoEm: null }],
        },
        hoje,
      ).inicio,
    ).toBe("2026-11-26");
  });

  it("dentroDoPeriodo inclui as pontas", () => {
    const periodo = { inicio: "2026-11-25", fim: "2026-11-27" };
    expect(dentroDoPeriodo("2026-11-25", periodo)).toBe(true);
    expect(dentroDoPeriodo("2026-11-27", periodo)).toBe(true);
    expect(dentroDoPeriodo("2026-11-28", periodo)).toBe(false);
  });
});
