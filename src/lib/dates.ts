// 日付は "YYYY-MM-DD" の文字列で扱う。タイムゾーンでずれないよう、計算はすべて UTC の 0 時で行う。

export const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const toDate = (s: string) => new Date(`${s}T00:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export const isDate = (s: string | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(toDate(s).getTime());
export const isMonth = (s: string | undefined): s is string => !!s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

/** サーバー（Vercel は UTC）でも日本の「今日」を出す */
export const todayInJapan = () => fmt(new Date(Date.now() + 9 * 60 * 60 * 1000));

export function addDays(s: string, n: number) {
  const d = toDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

export function addMonths(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  return fmt(new Date(Date.UTC(y, m - 1 + n, 1))).slice(0, 7);
}

export const weekday = (s: string) => toDate(s).getUTCDay();

/** from から to まで（両端を含む）の日付 */
export function dateRange(from: string, to: string) {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

/** 月カレンダーに並べる日付。日曜始まりで、前後の月の日も含めて 7 の倍数にする */
export function monthGrid(month: string) {
  const first = `${month}-01`;
  const last = addDays(`${addMonths(month, 1)}-01`, -1);
  return dateRange(addDays(first, -weekday(first)), addDays(last, 6 - weekday(last)));
}

export function formatDay(s: string) {
  const [, m, d] = s.split("-").map(Number);
  return `${m}月${d}日（${WEEKDAYS[weekday(s)]}）`;
}

export function formatMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${y}年${m}月`;
}
