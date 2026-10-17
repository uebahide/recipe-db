import LoginForm from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <h1>レシピDB</h1>
      <p>一度作った料理は、二度と忘れない。推しノートと同じメールアドレスとパスワードで入れます。</p>
      {error === "link" && <p className="err">メールのリンクが無効か期限切れです。もう一度ログインしてください。</p>}
      <LoginForm />
    </main>
  );
}
