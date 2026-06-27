import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { MobileTopBar } from "@/components/MobileTopBar";
import { getBodyStationEntry, getBodyStationIndex } from "@/lib/body-station";

type PageProps = {
  params: Promise<{ day: string }>;
  searchParams: Promise<{ from?: string }>;
};

export default async function BodyStationDetailPage({ params, searchParams }: PageProps) {
  const [{ day: dayParam }, query] = await Promise.all([params, searchParams]);
  const day = Number(dayParam);
  if (!Number.isInteger(day) || day < 1 || day > 100) notFound();

  const entry = getBodyStationEntry(day);
  const stationGroups = Array.from({ length: 4 }, (_, index) => {
    const start = index * 25 + 1;
    return getBodyStationIndex().slice(start - 1, start + 24);
  });
  const backHref = query.from === "day" ? `/day/${day}` : "/body-station";

  return (
    <AuthGate>
      <main className="viewport">
        <section className="paper-frame body-station-detail grid min-h-[calc(100vh-28px)] grid-rows-[56px_1fr] overflow-auto">
          <MobileTopBar
            rightAction={<Link aria-label="返回" className="mobile-topbar__action" href={backHref}>返回</Link>}
            title={`身体驿站 · Day ${String(day).padStart(2, "0")}`}
          />

          {entry ? (
            <article className="mx-auto grid w-full max-w-4xl gap-7 px-[clamp(20px,4vw,54px)] py-[clamp(28px,5vw,58px)]">
              <nav className="body-station-detail__day-picker" aria-label="身体驿站日期选择">
                <span>你要解锁哪一天</span>
                {stationGroups.map((group, index) => (
                  <details key={index} open={group.some((station) => station.day === day) || index === 0}>
                    <summary>Day {String(group[0]?.day ?? 1).padStart(2, "0")}–{String(group.at(-1)?.day ?? 25).padStart(2, "0")}</summary>
                    <div>
                      {group.map((station) => (
                        <Link
                          className={station.day === day ? "is-active" : ""}
                          href={`/body-station/${station.day}`}
                          key={station.day}
                        >
                          Day {String(station.day).padStart(2, "0")}
                        </Link>
                      ))}
                    </div>
                  </details>
                ))}
              </nav>
              <header className="border-b border-[var(--line)] pb-6">
                <div className="eyebrow mb-4">Body station · Day {String(day).padStart(2, "0")}</div>
                <h1 className="font-serif text-[clamp(42px,6vw,82px)] font-normal leading-[.96] text-ink">
                  {entry.theme}
                </h1>
                <p className="mt-3 text-2xl leading-tight text-clay">{entry.subtitle}</p>
                {entry.intro ? (
                  <blockquote className="mt-5 border-l border-clay/45 pl-4 text-lg leading-[1.8] text-[#563a2e]">
                    {entry.intro}
                  </blockquote>
                ) : null}
              </header>

              <div className="grid gap-5">
                {entry.sections.map((section) => (
                  <section className="thin-panel p-5" key={section.title}>
                    <h2 className="m-0 text-2xl font-normal text-ink">{stripSectionNumber(section.title)}</h2>
                    <div className="mt-3 grid gap-3 text-[15px] leading-[1.9] text-[#563a2e]">
                      {renderParagraphs(section.content)}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ) : (
            <section className="grid place-items-center p-8 text-center">
              <div className="thin-panel max-w-md p-8">
                <div className="eyebrow mb-3">Locked station</div>
                <h1 className="text-4xl font-normal text-ink">这一站还在路上。</h1>
                <p className="mt-4 leading-[1.8] text-[#563a2e]">
                  Day {day} 的身体驿站正文还没有上线。完成当天内容后，这里会作为身体小语的延展阅读打开。
                </p>
                <Link className="action-primary mt-6 inline-flex" href={backHref}>
                  返回
                </Link>
              </div>
            </section>
          )}
        </section>
      </main>
    </AuthGate>
  );
}

function stripSectionNumber(value: string) {
  return value.replace(/^\s*\d+\s*[.、·-]?\s*/u, "");
}

function renderParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => (
      <p className="m-0 whitespace-pre-line" key={paragraph}>
        {paragraph}
      </p>
    ));
}
