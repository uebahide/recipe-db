import type { SupabaseClient } from "@supabase/supabase-js";
import { signPhotos } from "./recipes";
import type { Ingredient, Recipe, RecipeStats, Step } from "./types";

export async function loadRecipe(supabase: SupabaseClient<any, "recipe">, id: string) {
  const { data: recipe } = await supabase.from("recipes").select("*").eq("id", id).maybeSingle();
  if (!recipe) return null;
  const r = recipe as Recipe;
  const [ing, st, stats, photos] = await Promise.all([
    supabase.from("ingredients").select("position, group_label, name, amount, note").eq("recipe_id", id).order("position"),
    supabase.from("steps").select("position, body, timer_sec, caution").eq("recipe_id", id).order("position"),
    supabase.from("recipe_stats").select("recipe_id, cook_count, avg_rating, last_cooked_on, mastery").eq("recipe_id", id).maybeSingle(),
    signPhotos(supabase, [r.photo_path]),
  ]);
  return {
    recipe: r,
    ingredients: (ing.data ?? []) as Ingredient[],
    steps: (st.data ?? []) as Step[],
    stats: (stats.data ?? null) as RecipeStats | null,
    photoUrl: r.photo_path ? photos.get(r.photo_path) ?? null : null,
  };
}
