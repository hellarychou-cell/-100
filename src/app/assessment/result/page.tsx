import Link from "next/link";
import { AssessmentResultClient } from "@/components/AssessmentResultClient";

export default function AssessmentResultPage() {
  return (
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100</div>
          <span>底层代码诊断报告</span>
          <div className="flex items-center gap-2">
            <span className="action-ghost !px-3 !py-2 !text-xs">保存报告</span>
            <Link
              aria-label="返回主页"
              className="grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/60 text-lg leading-none text-ink transition hover:bg-ink hover:text-soft"
              href="/"
            >
              ×
            </Link>
          </div>
        </header>
        <AssessmentResultClient />
      </section>
    </main>
  );
}
