import { redirect } from "next/navigation";
import RecipeList from "@/components/RecipeList";
import { loadStats, signPhotos } from "@/lib/recipes";
import { createClient } from "@/lib/supabase/server";
import type { Recipe, RecipeCard } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // このアカウントがレシピDBを使っていることを共通の利用者一覧に残す（2回目以降は何もしない）
  await supabase.schema("core").from("app_members").upsert({ app_slug: "recipe" }, { onConflict: "user_id,app_slug", ignoreDuplicates: true });

  const { data, error } = await supabase.from("recipes").select("*").order("updated_at", { ascending: false });
  const recipes = (data ?? []) as Recipe[];
  const [stats, photos] = await Promise.all([loadStats(supabase), signPhotos(supabase, recipes.map((r) => r.photo_path))]);
  const cards: RecipeCard[] = recipes.map((r) => ({
    ...r,
    stats: stats.get(r.id) ?? null,
    photoUrl: r.photo_path ? photos.get(r.photo_path) ?? null : null,
  }));

  return <RecipeList recipes={cards} email={user.email ?? ""} loadError={error?.message ?? null} />;
}
