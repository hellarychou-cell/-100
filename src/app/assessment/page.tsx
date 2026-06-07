import Link from "next/link";
import { AssessmentFlow } from "@/components/AssessmentFlow";

export default function AssessmentPage() {
  return (
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100</div>
          <span>底层代码诊断 · 42 题</span>
          <Link
            aria-label="返回主页"
            className="grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/60 text-lg leading-none text-ink transition hover:bg-ink hover:text-soft"
            href="/"
          >
            ×
          </Link>
        </header>
        <AssessmentFlow />
      </section>
    </main>
  );
}
