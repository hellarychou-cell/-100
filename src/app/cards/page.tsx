import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { MysteryCard } from "@/components/MysteryCard";
import { getToolCards } from "@/lib/tool-cards";

export default function CardsPage() {
  const toolCards = getToolCards();
  const featuredCard = toolCards[0];
  const slots = Array.from({ length: 25 }, (_, index) => {
    const card = toolCards[index];
    return card ? { name: card.front.name, collected: true } : { collected: false };
  });

  return (
    <AuthGate>
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100</div>
          <span>神秘卡册</span>
          <Link
            aria-label="回到我的匣子"
            className="grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/60 text-lg leading-none text-ink transition hover:bg-ink hover:text-soft"
            href="/treasure"
          >
            ×
          </Link>
        </header>
        <section className="grid min-h-0 grid-cols-[330px_1fr] gap-9 p-[clamp(18px,2.8vw,34px)] max-lg:grid-cols-1">
          <div className="grid min-h-0 grid-rows-[auto_1fr_auto] max-lg:grid-cols-[1fr_220px] max-lg:gap-5 max-sm:grid-cols-1">
            <div>
              <div className="eyebrow mb-3">Mystery card album</div>
              <h1 className="display-title text-5xl">你收下的<br />女性力量。</h1>
            </div>
            <div className="self-center justify-self-center">
              <MysteryCard front={featuredCard.front} back={featuredCard.back} />
            </div>
            <p className="text-[15px] leading-[1.75] text-[#563a2e]">
              点开卡片可以翻到背面，查看工具卡完整内容。未解锁的卡位会保留一点影子。
            </p>
          </div>
          <section className="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4">
            <div className="flex items-end justify-between border-b border-[var(--line)] pb-4">
              <h2 className="m-0 text-4xl font-normal leading-none">卡册</h2>
              <span className="sans text-xs text-[var(--muted)]">已接入 {toolCards.length} / 25 · 按工具卡总数展示</span>
            </div>
            <div className="grid min-h-0 grid-cols-6 gap-2 max-md:grid-cols-4 max-sm:grid-cols-3">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className={`grid min-h-28 place-items-center border border-[var(--line)] p-2 text-center ${
                    slot.collected
                      ? "bg-gradient-to-br from-[#241610] via-[#744531] to-gold text-paper"
                      : "bg-paper/50 opacity-45"
                  }`}
                >
                  <div>
                    <b className="font-normal">{slot.name ?? "待解锁"}</b>
                  </div>
                </div>
              ))}
            </div>
            <button className="text-link justify-self-center bg-transparent">展开更多卡位</button>
          </section>
        </section>
      </section>
    </main>
    </AuthGate>
  );
}
