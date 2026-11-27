import { paraInputDate } from "./datas";

// Funções PURAS do calendário: recebem datas e devolvem estruturas prontas pra desenhar.
// Trabalham com "dias" no formato "AAAA-MM-DD" (no fuso de Brasília), que dá pra
// comparar como texto e usar como chave. Testadas em calendario.test.ts.

export type Mes = { ano: number; mes: number }; // mes: 1 a 12

/** "2026-12" → { ano: 2026, mes: 12 }. Valor inválido → o mês de `hoje`. */
export function lerMes(valor: string | undefined, hoje: Date): Mes {
  const casou = valor?.match(/^(\d{4})-(\d{2})$/);
  if (casou) {
    const ano = Number(casou[1]);
    const mes = Number(casou[2]);
    if (mes >= 1 && mes <= 12 && ano >= 2000 && ano <= 2100)
      return { ano, mes };
  }
  const [ano, mes] = paraInputDate(hoje).split("-").map(Number);
  return { ano, mes };
}

/** { 2026, 12 } → "2026-12" */
export function mesParaTexto({ ano, mes }: Mes): string {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

/** Mês anterior ou seguinte (passa de dezembro pra janeiro e vice-versa). */
export function mesVizinho({ ano, mes }: Mes, deslocamento: number): Mes {
  const total = ano * 12 + (mes - 1) + deslocamento;
  return { ano: Math.floor(total / 12), mes: (total % 12) + 1 };
}

/** "2026-12-05" a partir de números, sem passar por fuso nenhum. */
function dia(ano: number, mes: number, numero: number): string {
  // Date.UTC "corrige" estouros: dia 0 = último dia do mês anterior, dia 32 = começo do seguinte.
  return new Date(Date.UTC(ano, mes - 1, numero)).toISOString().slice(0, 10);
}

/**
 * As semanas que aparecem na grade do mês (domingo a sábado), incluindo os dias do
 * mês anterior/seguinte que completam a primeira e a última semana.
 */
export function semanasDoMes({ ano, mes }: Mes): string[][] {
  const diaDaSemanaDo1 = new Date(Date.UTC(ano, mes - 1, 1)).getUTCDay(); // 0 = domingo
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const totalDeCelulas = Math.ceil((diaDaSemanaDo1 + diasNoMes) / 7) * 7;

  const semanas: string[][] = [];
  for (let i = 0; i < totalDeCelulas; i++) {
    if (i % 7 === 0) semanas.push([]);
    semanas[semanas.length - 1].push(dia(ano, mes, i - diaDaSemanaDo1 + 1));
  }
  return semanas;
}

/** Primeiro e último dia do mês, como "AAAA-MM-DD". */
export function limitesDoMes({ ano, mes }: Mes): {
  inicio: string;
  fim: string;
} {
  return { inicio: dia(ano, mes, 1), fim: dia(ano, mes + 1, 0) };
}

type EmprestimoParaPeriodo = {
  status: "ABERTO" | "PARCIAL" | "DEVOLVIDO";
  retiradoEm: Date;
  previsaoDevolucao: Date | null;
  itens: { devolvidoEm: Date | null }[];
};

/**
 * De qual dia a qual dia o material ficou (ou ficará) com o colaborador.
 * - Devolvido: até o dia da última devolução.
 * - Aberto com prazo no futuro: até o prazo.
 * - Aberto e atrasado, ou sem prazo: até hoje (continua com ele).
 */
export function periodoDoEmprestimo(
  emprestimo: EmprestimoParaPeriodo,
  hoje: Date,
): { inicio: string; fim: string } {
  const inicio = paraInputDate(emprestimo.retiradoEm);
  const diaDeHoje = paraInputDate(hoje);

  let fim: string;
  if (emprestimo.status === "DEVOLVIDO") {
    const devolucoes = emprestimo.itens
      .map((item) => item.devolvidoEm)
      .filter((data): data is Date => data !== null)
      .map(paraInputDate)
      .sort();
    fim = devolucoes.at(-1) ?? inicio;
  } else if (emprestimo.previsaoDevolucao) {
    const prazo = paraInputDate(emprestimo.previsaoDevolucao);
    fim = prazo >= diaDeHoje ? prazo : diaDeHoje;
  } else {
    fim = diaDeHoje;
  }

  // Segurança: um período nunca termina antes de começar.
  return { inicio, fim: fim < inicio ? inicio : fim };
}

/** O dia `d` está dentro do período (inclusive nas pontas)? */
export function dentroDoPeriodo(
  d: string,
  periodo: { inicio: string; fim: string },
): boolean {
  return d >= periodo.inicio && d <= periodo.fim;
}
