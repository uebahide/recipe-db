"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

// Supabase のエラーを、ユーザーが次に何をすればいいか分かる日本語にする
function toMessage(message: string) {
  if (/invalid login credentials/i.test(message)) return "メールアドレスかパスワードが違います。";
  if (/email not confirmed/i.test(message)) return "このメールアドレスはまだ確認されていません。Supabase の設定で「Confirm email」をオフにしてください。";
  if (/already registered|already exists/i.test(message)) return "このメールアドレスはもう登録されています。「ログイン」から入ってください。";
  if (/password should be at least/i.test(message)) return "パスワードは6文字以上にしてください。";
  if (/rate limit/i.test(message)) return "短い時間に何度も試したため、少し待ってからもう一度試してください。";
  return message;
}

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    const supabase = createClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(toMessage(error.message));
        setBusy(false);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(toMessage(error.message));
        setBusy(false);
        return;
      }
      if (!data.session) {
        // Supabase 側でメール確認が有効なままだとセッションが返らない
        setInfo("登録しました。ただし Supabase の設定でメール確認が有効なため、まだログインできません。「Confirm email」をオフにするか、届いたメールのリンクを開いてください。");
        setBusy(false);
        return;
      }
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <div className="tabs" role="group" aria-label="ログインか新規登録か">
        <button type="button" className="tab" aria-pressed={mode === "signin"} onClick={() => { setMode("signin"); setError(""); setInfo(""); }}>ログイン</button>
        <button type="button" className="tab" aria-pressed={mode === "signup"} onClick={() => { setMode("signup"); setError(""); setInfo(""); }}>新規登録</button>
      </div>
      <form onSubmit={onSubmit}>
        <label className="label" htmlFor="email">メールアドレス</label>
        <input id="email" className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <label className="label" htmlFor="password">パスワード{mode === "signup" && "（6文字以上）"}</label>
        <input
          id="password"
          className="field"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="btn primary" disabled={busy} style={{ justifyContent: "center", padding: "10px 16px" }}>
          {busy ? "お待ちください…" : mode === "signin" ? "ログイン" : "登録してはじめる"}
        </button>
        {error && <p className="err" role="alert">{error}</p>}
        {info && <p role="status">{info}</p>}
      </form>
    </>
  );
}
