export type Recipe = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  cuisine: string | null;
  difficulty: number;
  servings: number | null;
  prep_min: number | null;
  cook_min: number | null;
  taste_sweet: number;
  taste_salty: number;
  taste_sour: number;
  taste_spicy: number;
  taste_umami: number;
  taste_rich: number;
  seasons: string[];
  weathers: string[];
  situations: string[];
  tags: string[];
  tips: string | null;
  source_url: string | null;
  photo_path: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type Ingredient = {
  position: number;
  group_label: string | null;
  name: string;
  amount: string | null;
  note: string | null;
};

export type Step = {
  position: number;
  body: string;
  timer_sec: number | null;
  caution: string | null;
};

export type Mastery = "untried" | "first" | "practicing" | "confident" | "signature";

export type RecipeStats = {
  recipe_id: string;
  cook_count: number;
  avg_rating: number | null;
  last_cooked_on: string | null;
  mastery: Mastery;
};

/** 一覧で使う形: レシピ + 熟練度 + 写真の表示用URL */
export type RecipeCard = Recipe & { stats: RecipeStats | null; photoUrl: string | null };
