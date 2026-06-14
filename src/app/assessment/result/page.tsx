import Link from "next/link";
import { AssessmentResultClient } from "@/components/AssessmentResultClient";

type AssessmentResultPageProps = {
  searchParams: Promise<{ from?: string }>;
};

export default async function AssessmentResultPage({ searchParams }: AssessmentResultPageProps) {
  const params = await searchParams;
  const closeHref = params.from === "treasure" ? "/treasure" : "/home";

  return (
    <main className="viewport">
      <style>{`
        @media print {
          .topbar { display: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>
      <section className="paper-frame grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100</div>
          <span>底层代码诊断报告</span>
          <div className="flex items-center gap-2">
            <Link
              aria-label="返回主页"
              className="grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/60 text-lg leading-none text-ink transition hover:bg-ink hover:text-soft"
              href={closeHref}
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
