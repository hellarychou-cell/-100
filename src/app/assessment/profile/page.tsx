import Link from "next/link";
import { AssessmentProfileForm } from "@/components/AssessmentProfileForm";

export default function AssessmentProfilePage() {
  return (
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100</div>
          <span>测评前 · 基础信息</span>
          <Link
            aria-label="返回主页"
            className="grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/60 text-lg leading-none text-ink transition hover:bg-ink hover:text-soft"
            href="/"
          >
            ×
          </Link>
        </header>
        <section className="grid min-h-0 grid-cols-[minmax(300px,.72fr)_minmax(460px,1fr)] gap-9 p-[clamp(20px,3vw,38px)] max-lg:grid-cols-1">
          <div className="grid min-h-0 grid-rows-[auto_1fr_auto] max-lg:block">
            <div>
              <div className="eyebrow mb-3">Before assessment</div>
              <h1 className="display-title text-[clamp(48px,6vw,86px)]">
                先简单
                <br />
                认识你。
              </h1>
            </div>
            <p className="self-center max-w-md text-[17px] leading-[1.9] text-[#563a2e] max-lg:my-5">
              这些信息会让报告更像是在对你说话，而不是一份泛泛的测试结果。
            </p>
            <div className="border-y border-[var(--line)] py-4 sans text-xs leading-relaxed text-[var(--muted)]">
              注册身份已经建立。这里填写的内容会存入“我的匣子”，用于生成个性化报告。
            </div>
          </div>
          <AssessmentProfileForm />
        </section>
      </section>
    </main>
  );
}
