"use client";

import Link from "next/link";
import { useState } from "react";
import { WEEKDAYS, addDays, addMonths, formatMonth, weekday } from "@/lib/dates";
import { MEALS } from "@/lib/labels";
import type { MealPlan, RecipeOption } from "@/lib/types";
import DaySheet from "./DaySheet";

type Props = {
  month: string;
  days: string[];
  today: string;
  initialPlans: MealPlan[];
  recipes: RecipeOption[];
  loadError: string | null;
};

const MAX_IN_CELL = 3;
const mealOrder = (p: MealPlan) => MEALS.findIndex(([m]) => m === p.meal) * 1000 + p.position;

export default function MealCalendar({ month, days, today, initialPlans, recipes, loadError }: Props) {
  const [plans, setPlans] = useState(initialPlans);
  const [open, setOpen] = useState<string | null>(null);

  const byDay = new Map<string, MealPlan[]>();
  for (const p of [...plans].sort((a, b) => mealOrder(a) - mealOrder(b))) {
    byDay.set(p.planned_on, [...(byDay.get(p.planned_on) ?? []), p]);
  }
  // 今月を見ているなら今日の週から、それ以外はその月の初日の週から
  const weekStart = (d: string) => addDays(d, -weekday(d));
  const shoppingFrom = today.startsWith(month) ? weekStart(today) : weekStart(`${month}-01`);

  return (
    <main className="wrap">
      <header className="top">
        <div className="brand">
          <h1>献立</h1>
          <Link className="back" href="/">‹ レシピ一覧</Link>
        </div>
        <Link className="btn sm" href={`/plan/shopping?from=${shoppingFrom}`}>🛒 買い物リスト</Link>
      </header>

      {loadError && <p className="err">献立を読み込めませんでした（{loadError}）。少し待ってから開き直してください。</p>}

      <div className="monthnav">
        <Link className="btn sm ghost" href={`/plan?month=${addMonths(month, -1)}`} aria-label="前の月">‹</Link>
        <h2>{formatMonth(month)}</h2>
        <Link className="btn sm ghost" href={`/plan?month=${addMonths(month, 1)}`} aria-label="次の月">›</Link>
        {!today.startsWith(month) && <Link className="btn sm ghost" href="/plan">今月</Link>}
      </div>

      <div className="legend">
        {MEALS.map(([m, l]) => (
          <span key={m} className={`it ${m}`}>{l}</span>
        ))}
        <span className="muted">日付をタップして献立を入れます</span>
      </div>

      <section className="cal" aria-label={`${formatMonth(month)}の献立`}>
        <div className="wk">
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`dow${i === 0 ? " sun" : i === 6 ? " sat" : ""}`}>{w}</div>
          ))}
        </div>
        <div className="wk">
          {days.map((d) => {
            const items = byDay.get(d) ?? [];
            const cls = ["day", d.startsWith(month) ? "" : "out", d === today ? "today" : "", d < today ? "past" : ""].filter(Boolean).join(" ");
            return (
              <button key={d} className={cls} onClick={() => setOpen(d)} aria-label={`${d} の献立（${items.length}品）`}>
                <span className="d">{Number(d.slice(8))}</span>
                {items.slice(0, MAX_IN_CELL).map((p) => (
                  <span key={p.id} className={`it ${p.meal} ${p.status}`}>{p.title}</span>
                ))}
                {items.length > MAX_IN_CELL && <span className="more">ほか{items.length - MAX_IN_CELL}品</span>}
              </button>
            );
          })}
        </div>
      </section>

      {open && (
        <DaySheet
          date={open}
          plans={byDay.get(open) ?? []}
          recipes={recipes}
          setPlans={setPlans}
          // 読み込んだ範囲（このカレンダーに出ている日）の中だけ移動できる
          onPrev={open > days[0] ? () => setOpen(addDays(open, -1)) : undefined}
          onNext={open < days[days.length - 1] ? () => setOpen(addDays(open, 1)) : undefined}
          onClose={() => setOpen(null)}
        />
      )}
    </main>
  );
}
