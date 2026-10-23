"use client";

import { useEffect, useState } from "react";

export type ShoppingItem = { name: string; uses: { dish: string; amount: string | null }[] };

type Props = { storageKey: string; items: ShoppingItem[]; noIngredients: string[]; freeText: string[] };

// チェックはこの端末にだけ残す（買い物中に画面を閉じても消えないように）
function loadChecked(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  } catch {
    return [];
  }
}

export default function ShoppingList({ storageKey, items, noIngredients, freeText }: Props) {
  const [checked, setChecked] = useState<string[]>([]);
  useEffect(() => setChecked(loadChecked(storageKey)), [storageKey]);

  const toggle = (name: string) => {
    const next = checked.includes(name) ? checked.filter((x) => x !== name) : [...checked, name];
    setChecked(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // 保存できなくてもチェック自体は使える
    }
  };

  const sorted = [...items].sort((a, b) => Number(checked.includes(a.name)) - Number(checked.includes(b.name)));
  const left = items.filter((i) => !checked.includes(i.name)).length;

  return (
    <article className="sheet">
      <section className="sec">
        <h2>
          買うもの<small className="muted">残り {left} / {items.length}</small>
        </h2>
        {items.length === 0 ? (
          <p className="muted">材料が登録されたレシピがありません。</p>
        ) : (
          <ul className="shop">
            {sorted.map((i) => (
              <li key={i.name} className={checked.includes(i.name) ? "done" : ""}>
                <label>
                  <input type="checkbox" checked={checked.includes(i.name)} onChange={() => toggle(i.name)} />
                  <span className="nm">{i.name}</span>
                  <small className="muted">{i.uses.map((u) => (u.amount ? `${u.dish} ${u.amount}` : u.dish)).join("・")}</small>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
      {(noIngredients.length > 0 || freeText.length > 0) && (
        <section className="sec">
          <h2>材料がわからない料理</h2>
          <p className="muted" style={{ fontSize: ".88rem" }}>
            {[...noIngredients.map((t) => `${t}（材料未登録）`), ...freeText].join("、")}
          </p>
        </section>
      )}
    </article>
  );
}
