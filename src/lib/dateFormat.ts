/**
 * Utilitários de formatação de data para o padrão brasileiro DD/MM/AA.
 *
 * IMPORTANTE: Usar apenas para exibição. Datas devem continuar sendo
 * salvas em ISO/timestamp no banco.
 */

/**
 * Formata uma data (string ISO, Date ou timestamp) para DD/MM/AA.
 * Para datas "date-only" (YYYY-MM-DD), evita problemas de timezone
 * tratando como data local.
 */
export function formatDateBR(input: string | Date | null | undefined): string {
  if (!input) return "—";

  let date: Date;

  if (typeof input === "string") {
    // Se for formato date-only (YYYY-MM-DD), tratar como local
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y, m, d] = input.split("-");
      date = new Date(Number(y), Number(m) - 1, Number(d));
    } else {
      date = new Date(input);
    }
  } else {
    date = input;
  }

  if (isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${day}/${month}/${year}`;
}

/**
 * Formata uma data+hora para DD/MM/AA HH:mm.
 */
export function formatDateTimeBR(input: string | Date | null | undefined): string {
  if (!input) return "—";

  const date = typeof input === "string" ? new Date(input) : input;

  if (isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formata data com dia da semana abreviado: seg, 17/02/26
 */
export function formatDateWeekdayBR(input: string | Date | null | undefined): string {
  if (!input) return "—";

  let date: Date;

  if (typeof input === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
      const [y, m, d] = input.split("-");
      date = new Date(Number(y), Number(m) - 1, Number(d));
    } else {
      date = new Date(input);
    }
  } else {
    date = input;
  }

  if (isNaN(date.getTime())) return "—";

  const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
  return `${weekday} ${formatDateBR(date)}`;
}
