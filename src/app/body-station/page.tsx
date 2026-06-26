import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { BodyStationIndexClient } from "@/components/BodyStationIndexClient";
import { getBodyStationIndex } from "@/lib/body-station";
import { MobileTopBar } from "@/components/MobileTopBar";

export default function BodyStationPage() {
  const items = getBodyStationIndex();
  const readyCount = items.filter((item) => item.status === "ready").length;

  return (
    <AuthGate>
      <main className="viewport">
        <section className="paper-frame body-station-page grid min-h-[calc(100vh-28px)] grid-rows-[56px_auto_1fr] overflow-auto">
          <MobileTopBar
            rightAction={<Link aria-label="回到我的匣子" className="mobile-topbar__action" href="/treasure">返回匣子</Link>}
            title="身体驿站"
          />

          <section className="grid grid-cols-[minmax(260px,.72fr)_minmax(360px,1fr)] gap-8 border-b border-[var(--line)] px-[clamp(20px,4vw,54px)] py-[clamp(28px,5vw,56px)] max-lg:grid-cols-1">
            <div>
              <div className="eyebrow mb-4">Body station</div>
              <h1 className="display-title text-[clamp(48px,7vw,104px)]">
                身体
                <br />
                驿站。
              </h1>
            </div>
            <div className="self-end">
              <p className="max-w-2xl text-[clamp(16px,1.5vw,20px)] leading-[1.85] text-[#563a2e]">
                身体小语是今晚就能做的小动作；身体驿站是它背后的延展阅读。你每收下一个 Day，就会点亮对应的一篇。
              </p>
              <div className="mt-6 grid grid-cols-3 border-y border-[var(--line)] sans text-xs text-[var(--muted)]">
                <Metric value={String(readyCount).padStart(2, "0")} label="已上线" />
                <Metric value="100" label="总篇数" />
                <Metric value="01" label="解锁方式" last />
              </div>
            </div>
          </section>

          <section className="px-[clamp(20px,4vw,54px)] py-8">
            <BodyStationIndexClient items={items} />
          </section>
        </section>
      </main>
    </AuthGate>
  );
}

function Metric({ value, label, last = false }: { value: string; label: string; last?: boolean }) {
  return (
    <div className={`p-3 ${last ? "" : "border-r border-[var(--line)]"}`}>
      <strong className="mb-1 block font-serif text-3xl font-normal leading-none text-ink">{value}</strong>
      {label}
    </div>
  );
}
