import Link from "next/link";
import { AssessmentResultClient } from "@/components/AssessmentResultClient";
import { MobileTopBar } from "@/components/MobileTopBar";

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
      <section className="paper-frame assessment-result-page grid grid-rows-[56px_1fr]">
        <MobileTopBar
          rightAction={<Link className="mobile-topbar__action" href={closeHref}>返回</Link>}
          title="测评结果"
        />
        <AssessmentResultClient />
      </section>
    </main>
  );
}
