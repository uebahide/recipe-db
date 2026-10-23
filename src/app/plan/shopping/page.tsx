import Link from "next/link";
import { redirect } from "next/navigation";
import ShoppingList, { type ShoppingItem } from "@/components/ShoppingList";
import { addDays, formatDay, isDate, todayInJapan } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const DAYS = 7;

export default async function ShoppingPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from: param } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const from = isDate(param) ? param : todayInJapan();
  const to = addDays(from, DAYS - 1);

  // 「予定」のままの料理だけ。作った・やめたものは買わなくていい
  const { data: plans, error } = await supabase
    .from("meal_plans")
    .select("recipe_id, title")
    .eq("status", "planned")
    .gte("planned_on", from)
    .lte("planned_on", to);
  const planned = (plans ?? []) as { recipe_id: string | null; title: string }[];
  const recipeIds = [...new Set(planned.map((p) => p.recipe_id).filter((id): id is string => !!id))];

  const { data: ings } = recipeIds.length
    ? await supabase.from("ingredients").select("recipe_id, name, amount").in("recipe_id", recipeIds).order("position")
    : { data: [] };
  const ingredients = (ings ?? []) as { recipe_id: string; name: string; amount: string | null }[];

  // 同じ材料はまとめ、どの料理で何に使うかを並べる。同じレシピを2回作るなら2回分出す
  const items = new Map<string, ShoppingItem>();
  for (const p of planned) {
    if (!p.recipe_id) continue;
    for (const g of ingredients.filter((i) => i.recipe_id === p.recipe_id)) {
      const name = g.name.trim();
      const item = items.get(name) ?? { name, uses: [] };
      item.uses.push({ dish: p.title, amount: g.amount });
      items.set(name, item);
    }
  }
  const withIngredients = new Set(ingredients.map((i) => i.recipe_id));
  const noIngredients = [...new Set(planned.filter((p) => p.recipe_id && !withIngredients.has(p.recipe_id)).map((p) => p.title))];
  const freeText = [...new Set(planned.filter((p) => !p.recipe_id).map((p) => p.title))];

  return (
    <main className="wrap">
      <div className="top">
        <Link className="back" href={`/plan?month=${from.slice(0, 7)}`}>‹ 献立</Link>
      </div>
      <div className="monthnav">
        <Link className="btn sm ghost" href={`/plan/shopping?from=${addDays(from, -DAYS)}`} aria-label="前の1週間">‹</Link>
        <h2>{formatDay(from)} 〜 {formatDay(to)}</h2>
        <Link className="btn sm ghost" href={`/plan/shopping?from=${addDays(from, DAYS)}`} aria-label="次の1週間">›</Link>
      </div>

      {error && <p className="err">献立を読み込めませんでした（{error.message}）。</p>}

      {planned.length === 0 ? (
        <section className="empty">
          <h2>この期間の献立はまだありません</h2>
          <p>献立カレンダーで料理を入れると、レシピの材料がここにまとまります。</p>
          <Link className="btn primary" href={`/plan?month=${from.slice(0, 7)}`}>献立を入れる</Link>
        </section>
      ) : (
        <ShoppingList storageKey={`shopping:${from}`} items={[...items.values()]} noIngredients={noIngredients} freeText={freeText} />
      )}
    </main>
  );
}
