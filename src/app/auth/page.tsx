import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";

type AuthPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const { mode } = await searchParams;
  const isRegister = mode === "register";

  return (
    <main className="viewport grid place-items-center">
      <section className="relative grid w-full max-w-3xl grid-cols-[.82fr_1fr] overflow-hidden border border-paper/50 bg-soft text-ink shadow-2xl max-md:grid-cols-1">
        <Link
          aria-label="返回主页"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/80 text-lg leading-none transition hover:bg-ink hover:text-soft"
          href="/"
        >
          ×
        </Link>
        <aside className="grid border-r border-[var(--line)] bg-paper/60 p-8 max-md:border-b max-md:border-r-0">
          <div className="text-xl">成她100</div>
          <h1 className="my-12 text-5xl font-normal leading-[.9] max-md:my-6">
            先有一个
            <br />
            属于你的身份。
          </h1>
          <p className="m-0 leading-[1.8] text-[#563a2e]">
            你的测评结果、100 天进度、神秘卡和 AI 对话，都会存入“我的匣子”。
          </p>
        </aside>
        <section className="p-8">
          <AuthForm mode={isRegister ? "register" : "login"} />
          <span className="text-link">忘记密码 / 联系开通</span>
        </section>
      </section>
    </main>
  );
}
