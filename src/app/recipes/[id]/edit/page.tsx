import { notFound, redirect } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import { loadRecipe } from "@/lib/load-recipe";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const data = await loadRecipe(supabase, id);
  if (!data) notFound();
  return <RecipeForm userId={user.id} recipe={data.recipe} ingredients={data.ingredients} steps={data.steps} photoUrl={data.photoUrl} />;
}
