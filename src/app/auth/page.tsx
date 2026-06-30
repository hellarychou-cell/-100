import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

type AuthPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { mode } = await searchParams;
  const isRegister = mode === "register";

  return (
    <main className="auth-page">
      <section className={`auth-shell ${isRegister ? "auth-shell--register" : "auth-shell--login"}`}>
        <header className="auth-shell__header">
          <span>成她100</span>
          <Link aria-label="返回首页" href="/">×</Link>
        </header>

        <section className="auth-shell__hero">
          <div>
            <h1>先有一个<br />属于你的身份</h1>
            <i />
            <p>这是你成长旅程的起点，<br />仅属于你自己的 100 天。</p>
          </div>
          <div aria-hidden className="auth-shell__portrait">
            <span className="auth-shell__head" />
            <span className="auth-shell__body" />
            <span className="auth-shell__twig" />
          </div>
        </section>

        <section className="auth-shell__form">
          <AuthForm mode={isRegister ? "register" : "login"} />
        </section>

        <footer className="auth-shell__privacy">
          <span aria-hidden>▣</span>
          <p>我们重视你的隐私与安全<br />所有信息仅用于为你提供更好的成长体验</p>
        </footer>
      </section>
    </main>
  );
}
