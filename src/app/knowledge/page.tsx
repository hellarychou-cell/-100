import Link from "next/link";
import { KnowledgeDayGrid } from "@/components/KnowledgeDayGrid";
import { getScheduleDays } from "@/lib/schedule";
import { MobileTopBar } from "@/components/MobileTopBar";

export default function KnowledgePage() {
  const previewDays = getScheduleDays().map((day) => ({
    day: day.day,
    dimension: day.dimension || "全维度",
    note: day.bodyNote || day.mysteryCard || "内容排期中",
    status: day.day <= 7 ? "已上线" : "排期已定",
    title: day.title,
  }));

  return (
    <main className="viewport">
      <section className="paper-frame knowledge-page relative grid min-h-[calc(100vh-28px)] grid-rows-[56px_auto_1fr] overflow-auto">
        <MobileTopBar
          rightAction={<Link aria-label="回到我的匣子" className="mobile-topbar__action" href="/treasure">返回匣子</Link>}
          title="知识库"
        />
        <header className="knowledge-page__intro">
          <h1>知识库 <span>/ 100天</span></h1>
          <p>四个阶段，慢慢打开</p>
          <section className="knowledge-page__progress">
            <span aria-hidden>▣</span>
            <div><p>已解锁 <strong>8</strong> / 100</p><i><b style={{ width: "8%" }} /></i><small>每天一点，每天靠近自己一点</small></div>
            <button type="button">▽<small>筛选</small></button>
          </section>
        </header>

        <section className="knowledge-page__directory">
          <div className="knowledge-page__section-title">
            <strong>△ 16 个主题周 · Day 01–100</strong>
            <button type="button">ⓘ 主题地图</button>
          </div>
          <KnowledgeDayGrid days={previewDays} />
        </section>
      </section>
    </main>
  );
}
