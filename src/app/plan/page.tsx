import { redirect } from "next/navigation";
import MealCalendar from "@/components/MealCalendar";
import { isMonth, monthGrid, todayInJapan } from "@/lib/dates";
import { MEAL_PLAN_COLS } from "@/lib/meal-plans";
import { createClient } from "@/lib/supabase/server";
import type { MealPlan, RecipeOption } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month: param } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayInJapan();
  const month = isMonth(param) ? param : today.slice(0, 7);
  const days = monthGrid(month);

  const [plans, recipes] = await Promise.all([
    supabase
      .from("meal_plans")
      .select(MEAL_PLAN_COLS)
      .gte("planned_on", days[0])
      .lte("planned_on", days[days.length - 1])
      .order("position"),
    supabase.from("recipes").select("id, title, category, is_favorite").order("updated_at", { ascending: false }),
  ]);

  return (
    <MealCalendar
      key={month}
      month={month}
      days={days}
      today={today}
      initialPlans={(plans.data ?? []) as MealPlan[]}
      recipes={(recipes.data ?? []) as RecipeOption[]}
      loadError={plans.error?.message ?? recipes.error?.message ?? null}
    />
  );
}
