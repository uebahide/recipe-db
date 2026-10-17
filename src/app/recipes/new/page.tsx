import { redirect } from "next/navigation";
import RecipeForm from "@/components/RecipeForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewRecipePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <RecipeForm userId={user.id} />;
}
