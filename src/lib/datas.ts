// DATAS E FUSO HORÁRIO
//
// No seu computador o Node roda no fuso de Brasília. Na Vercel (fase 7) roda em UTC,
// 3 horas à frente. Sem cuidado:
//   - "devolver até 03/12" venceria às 20:59 de Brasília (23:59 em UTC);
//   - um empréstimo feito às 22h de 02/12 apareceria como 03/12.
// Por isso o fuso do negócio fica fixo aqui e todo cálculo de "dia" passa por este arquivo.

export const FUSO = "America/Sao_Paulo";
// O Brasil não tem horário de verão desde 2019: o deslocamento é sempre -03:00.
const DESLOCAMENTO = "-03:00";

/** "2026-12-03" → 03/12/2026 às 23:59:59 no horário de Brasília (o prazo vale o dia todo). */
export function fimDoDia(data: string): Date {
  return new Date(`${data}T23:59:59${DESLOCAMENTO}`);
}

/** Date → "2026-12-03" no horário de Brasília (o formato do <input type="date">). */
export function paraInputDate(data: Date): string {
  // "en-CA" formata como AAAA-MM-DD; timeZone garante o dia de Brasília.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

/** "2026-12-03" → 03/12/2026 às 00:00 de Brasília (início do dia). */
export function inicioDoDia(data: string): Date {
  return new Date(`${data}T00:00:00${DESLOCAMENTO}`);
}

/**
 * "2026-12-03" → 03/12/2026 ao meio-dia de Brasília.
 * Pra datas "sem hora" (como o dia do evento): o meio-dia fica longe da meia-noite,
 * então nenhum fuso empurra a data pro dia anterior ou seguinte.
 */
export function meioDoDia(data: string): Date {
  return new Date(`${data}T12:00:00${DESLOCAMENTO}`);
}

/** Soma (ou subtrai) dias inteiros. */
export function somarDias(data: Date, dias: number): Date {
  return new Date(data.getTime() + dias * 24 * 60 * 60 * 1000);
}
