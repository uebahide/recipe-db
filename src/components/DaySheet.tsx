"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { formatDay } from "@/lib/dates";
import { CATEGORIES, MEALS, label } from "@/lib/labels";
import { MEAL_PLAN_COLS } from "@/lib/meal-plans";
import { createClient } from "@/lib/supabase/client";
import type { Meal, MealPlan, RecipeOption } from "@/lib/types";

type Props = {
  date: string;
  plans: MealPlan[];
  recipes: RecipeOption[];
  setPlans: Dispatch<SetStateAction<MealPlan[]>>;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
};

const STATUS_LABEL: Record<MealPlan["status"], string> = { planned: "予定", cooked: "作った", skipped: "やめた" };

export default function DaySheet({ date, plans, recipes, setPlans, onPrev, onNext, onClose }: Props) {
  const [adding, setAdding] = useState<Meal | null>(null);
  const [q, setQ] = useState("");
  const [rating, setRating] = useState<{ id: string; value: number | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 日付を移ったら入力途中のものは閉じる
  useEffect(() => {
    setAdding(null);
    setRating(null);
    setQ("");
    setError(null);
  }, [date]);

  const matches = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = query ? recipes.filter((r) => r.title.toLowerCase().includes(query)) : recipes.filter((r) => r.is_favorite);
    return (list.length || query ? list : recipes).slice(0, 8);
  }, [recipes, q]);

  const replace = (row: MealPlan) => setPlans((list) => list.map((p) => (p.id === row.id ? row : p)));

  // 失敗したらメッセージを出し、成功したら true を返す
  async function run(work: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const message = await work();
    if (message) setError(`保存できませんでした（${message}）`);
    setBusy(false);
    return !message;
  }

  const add = (meal: Meal, recipe: RecipeOption | null, title: string) =>
    run(async () => {
      const position = Math.max(-1, ...plans.filter((p) => p.meal === meal).map((p) => p.position)) + 1;
      const { data, error } = await createClient()
        .from("meal_plans")
        .insert({ planned_on: date, meal, position, recipe_id: recipe?.id ?? null, title })
        .select(MEAL_PLAN_COLS)
        .single();
      if (error) return error.message;
      setPlans((list) => [...list, data as MealPlan]);
      setQ("");
      setAdding(null);
      return null;
    });

  const update = (p: MealPlan, patch: Partial<MealPlan>) =>
    run(async () => {
      const { data, error } = await createClient().from("meal_plans").update(patch).eq("id", p.id).select(MEAL_PLAN_COLS).single();
      if (error) return error.message;
      replace(data as MealPlan);
      return null;
    });

  // レシピから選んだ料理は、作った記録（熟練度のもと）も一緒に残す
  const markCooked = (p: MealPlan, value: number | null) =>
    run(async () => {
      const supabase = createClient();
      let cook_log_id: string | null = null;
      if (p.recipe_id) {
        const { data, error } = await supabase.from("cook_logs").insert({ recipe_id: p.recipe_id, cooked_on: date, rating: value }).select("id").single();
        if (error) return error.message;
        cook_log_id = data.id as string;
      }
      const { data, error } = await supabase
        .from("meal_plans")
        .update({ status: "cooked", cook_log_id })
        .eq("id", p.id)
        .select(MEAL_PLAN_COLS)
        .single();
      if (error) return error.message;
      replace(data as MealPlan);
      setRating(null);
      return null;
    });

  const undoCooked = (p: MealPlan) =>
    run(async () => {
      const supabase = createClient();
      if (p.cook_log_id) {
        const { error } = await supabase.from("cook_logs").delete().eq("id", p.cook_log_id);
        if (error) return error.message;
      }
      const { data, error } = await supabase
        .from("meal_plans")
        .update({ status: "planned", cook_log_id: null })
        .eq("id", p.id)
        .select(MEAL_PLAN_COLS)
        .single();
      if (error) return error.message;
      replace(data as MealPlan);
      return null;
    });

  const remove = (p: MealPlan) =>
    run(async () => {
      const { error } = await createClient().from("meal_plans").delete().eq("id", p.id);
      if (error) return error.message;
      setPlans((list) => list.filter((x) => x.id !== p.id));
      return null;
    });

  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <section className="daysheet" role="dialog" aria-modal="true" aria-label={`${formatDay(date)}の献立`}>
        <div className="top">
          <div className="monthnav">
            <button className="btn sm ghost" onClick={onPrev} disabled={!onPrev} aria-label="前の日">‹</button>
            <h2>{formatDay(date)}</h2>
            <button className="btn sm ghost" onClick={onNext} disabled={!onNext} aria-label="次の日">›</button>
          </div>
          <button className="icon" onClick={onClose} aria-label="閉じる">✕</button>
        </div>

        {error && <p className="err">{error}</p>}

        {MEALS.map(([meal, mealLabel]) => {
          const items = plans.filter((p) => p.meal === meal);
          return (
            <div key={meal} className={`mealsec ${meal}`}>
              <div className="mh">
                <h3>{mealLabel}</h3>
                {adding !== meal && (
                  <button className="btn sm ghost" onClick={() => { setAdding(meal); setQ(""); }}>＋ 追加</button>
                )}
              </div>

              {items.map((p) => (
                <div key={p.id} className={`pitem ${p.status}`}>
                  <div className="pt">
                    {p.recipe_id ? <Link href={`/recipes/${p.recipe_id}`}>{p.title}</Link> : <span>{p.title}</span>}
                    {p.status !== "planned" && <span className={`st ${p.status}`}>{STATUS_LABEL[p.status]}</span>}
                  </div>
                  {rating?.id === p.id ? (
                    <div className="rate">
                      <span className="label">出来ばえ</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} className="star" aria-pressed={(rating.value ?? 0) >= n} onClick={() => setRating({ id: p.id, value: rating.value === n ? null : n })} aria-label={`${n}`}>★</button>
                      ))}
                      <button className="btn sm primary" disabled={busy} onClick={() => markCooked(p, rating.value)}>記録</button>
                      <button className="btn sm ghost" onClick={() => setRating(null)}>やめる</button>
                    </div>
                  ) : (
                    <div className="acts">
                      {p.status === "planned" && (
                        <>
                          <button className="btn sm" disabled={busy} onClick={() => (p.recipe_id ? setRating({ id: p.id, value: null }) : markCooked(p, null))}>作った</button>
                          <button className="btn sm ghost" disabled={busy} onClick={() => update(p, { status: "skipped" })}>やめた</button>
                        </>
                      )}
                      {p.status === "cooked" && <button className="btn sm ghost" disabled={busy} onClick={() => undoCooked(p)}>取り消す</button>}
                      {p.status === "skipped" && <button className="btn sm ghost" disabled={busy} onClick={() => update(p, { status: "planned" })}>予定に戻す</button>}
                      <button className="icon" disabled={busy} onClick={() => remove(p)} aria-label={`${p.title}を献立から外す`}>✕</button>
                    </div>
                  )}
                </div>
              ))}

              {items.length === 0 && adding !== meal && <p className="muted none">まだありません</p>}

              {adding === meal && (
                <div className="picker">
                  <input
                    className="search"
                    type="search"
                    autoFocus
                    placeholder="レシピを探す・料理名を入力（外食、残り物なども）"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && q.trim()) add(meal, null, q.trim());
                    }}
                  />
                  {!q.trim() && matches.length > 0 && <span className="label">{recipes.some((r) => r.is_favorite) ? "お気に入り" : "最近のレシピ"}</span>}
                  <div className="opts">
                    {matches.map((r) => (
                      <button key={r.id} className="opt" disabled={busy} onClick={() => add(meal, r, r.title)}>
                        <span>{r.title}</span>
                        <small className="muted">{label(CATEGORIES, r.category)}</small>
                      </button>
                    ))}
                    {q.trim() && (
                      <button className="opt free" disabled={busy} onClick={() => add(meal, null, q.trim())}>
                        <span>「{q.trim()}」をそのまま追加</span>
                        <small className="muted">レシピなし</small>
                      </button>
                    )}
                  </div>
                  <button className="btn sm ghost" onClick={() => setAdding(null)}>閉じる</button>
                </div>
              )}
            </div>
          );
        })}

        <div className="foot">
          <Link className="btn sm" href={`/plan/shopping?from=${date}`}>🛒 この日から1週間の買い物リスト</Link>
        </div>
      </section>
    </div>
  );
}
