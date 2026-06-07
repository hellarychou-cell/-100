import Link from "next/link";
import { readRootMarkdown } from "@/lib/markdown";

export default function PhilosophyPage() {
  const blocks = readRootMarkdown("成她-理念页.md").filter((block) => block.type !== "heading" || block.level <= 2);

  return (
    <main className="viewport">
      <section className="paper-frame relative grid min-h-[calc(100vh-28px)] place-items-center overflow-auto px-[clamp(18px,4vw,54px)] py-12">
        <Link
          aria-label="返回主页"
          className="absolute right-5 top-5 grid h-9 w-9 place-items-center border border-[var(--line)] bg-soft/70 sans text-xl leading-none text-ink transition hover:bg-ink hover:text-soft"
          href="/"
        >
          ×
        </Link>
        <article className="grid w-full max-w-5xl grid-cols-[minmax(240px,.72fr)_minmax(320px,1fr)] gap-[clamp(28px,5vw,72px)] max-md:grid-cols-1">
          <div className="self-end">
            <div className="eyebrow mb-4">A quiet surprise</div>
            <h1 className="display-title text-[clamp(54px,8vw,116px)]">
              成她
              <br />
              宣言。
            </h1>
            <p className="mt-6 max-w-sm sans text-sm leading-[1.9] text-[var(--muted)]">
              这是藏在主页里的小入口。不是说明功能，而是说明我们为什么要做这 100 天。
            </p>
          </div>
          <div className="border-l border-[var(--line)] pl-[clamp(22px,4vw,54px)] max-md:border-l-0 max-md:border-t max-md:pl-0 max-md:pt-8">
            <div className="max-h-[72vh] overflow-auto pr-4">
              {blocks.map((block, index) => {
                if (block.type === "heading") {
                  return (
                    <h2 key={`${block.text}-${index}`} className="mb-4 mt-7 text-3xl font-normal leading-tight first:mt-0">
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === "quote") {
                  return (
                    <p key={`${block.text}-${index}`} className="border-l border-clay pl-4 sans text-sm leading-relaxed text-clay">
                      {block.text}
                    </p>
                  );
                }
                return (
                  <p key={`${block.text}-${index}`} className="text-[clamp(16px,1.65vw,23px)] leading-[1.75] text-[#3d281f]">
                    {block.text}
                  </p>
                );
              })}
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
