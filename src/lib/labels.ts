import type { Mastery, Recipe } from "./types";

// DB に入る値（英語）と画面に出す言葉（日本語）の対応

export const CATEGORIES: [string, string][] = [
  ["main", "主菜"],
  ["side", "副菜"],
  ["soup", "汁物"],
  ["rice_noodle", "ご飯・麺"],
  ["salad", "サラダ"],
  ["dessert", "デザート"],
  ["drink", "飲み物"],
  ["bento", "お弁当"],
  ["other", "その他"],
];

export const CUISINES: [string, string][] = [
  ["japanese", "和食"],
  ["western", "洋食"],
  ["chinese", "中華"],
  ["korean", "韓国"],
  ["ethnic", "エスニック"],
  ["other", "その他"],
];

export const SEASONS: [string, string][] = [
  ["spring", "春"],
  ["summer", "夏"],
  ["autumn", "秋"],
  ["winter", "冬"],
];

export const WEATHERS: [string, string][] = [
  ["sunny", "晴れ"],
  ["cloudy", "くもり"],
  ["rainy", "雨"],
  ["snowy", "雪"],
  ["hot", "暑い日"],
  ["cold", "寒い日"],
];

export type TasteKey = "taste_sweet" | "taste_salty" | "taste_sour" | "taste_spicy" | "taste_umami" | "taste_rich";

export const TASTES: [TasteKey, string][] = [
  ["taste_sweet", "甘い"],
  ["taste_salty", "しょっぱい"],
  ["taste_sour", "酸っぱい"],
  ["taste_spicy", "辛い"],
  ["taste_umami", "旨み"],
  ["taste_rich", "こってり"],
];

/** シチュエーションは自由入力。よく使うものを候補として出す */
export const SITUATION_SUGGESTIONS = ["平日の夜", "疲れた日", "作り置き", "お弁当", "おもてなし", "休日", "二日酔い", "おつまみ", "朝ごはん"];

export const MASTERY: Record<Mastery, { label: string; level: number }> = {
  untried: { label: "未挑戦", level: 0 },
  first: { label: "初挑戦", level: 1 },
  practicing: { label: "練習中", level: 2 },
  confident: { label: "得意", level: 3 },
  signature: { label: "十八番", level: 4 },
};

export const label = (list: [string, string][], value: string | null | undefined) =>
  list.find(([v]) => v === value)?.[1] ?? "";

export function currentSeason(d = new Date()) {
  const m = d.getMonth() + 1;
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "winter";
}

export function totalMinutes(r: Pick<Recipe, "prep_min" | "cook_min">) {
  const t = (r.prep_min ?? 0) + (r.cook_min ?? 0);
  return t > 0 ? t : null;
}
