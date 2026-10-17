import type { SupabaseClient } from "@supabase/supabase-js";
import { PHOTO_BUCKET } from "./photos";
import type { RecipeStats } from "./types";

/** 非公開バケットの写真に、1時間だけ使える表示用URLを付ける */
export async function signPhotos(supabase: SupabaseClient<any, "recipe">, paths: (string | null)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length === 0) return new Map<string, string>();
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(list, 60 * 60);
  return new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
}

export async function loadStats(supabase: SupabaseClient<any, "recipe">) {
  const { data } = await supabase.from("recipe_stats").select("recipe_id, cook_count, avg_rating, last_cooked_on, mastery");
  return new Map(((data ?? []) as RecipeStats[]).map((s) => [s.recipe_id, s]));
}
