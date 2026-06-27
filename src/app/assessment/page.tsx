import Link from "next/link";
import { AssessmentFlow } from "@/components/AssessmentFlow";
import { MobileTopBar } from "@/components/MobileTopBar";

export default function AssessmentPage() {
  return (
    <main className="viewport">
      <section className="paper-frame assessment-page grid grid-rows-[56px_1fr]">
        <MobileTopBar
          rightAction={<Link className="mobile-topbar__action" href="/assessment/profile">基础信息</Link>}
          title="人生母题测评"
        />
        <AssessmentFlow />
      </section>
    </main>
  );
}
