import Link from "next/link";
import { readRootMarkdown, type MarkdownBlock } from "@/lib/markdown";
import { MobileTopBar } from "@/components/MobileTopBar";

type PhilosophySection = {
  title: string;
  blocks: MarkdownBlock[];
};

export default function PhilosophyPage() {
  const sections = groupSections(readRootMarkdown("成她-理念页.md"));
  const manifesto = sections.find((section) => section.title.includes("成她宣言"));
  const cards = sections.filter((section) => !section.title.includes("成她宣言"));
  const manifestoLines = manifesto?.blocks.filter((block) => block.type === "quote").map((block) => block.text) ?? [
    "不需要变成谁，",
    "只是慢慢回到自己。",
  ];

  return (
    <main className="viewport botanical-page">
      <section className="paper-frame philosophy-page grid grid-rows-[56px_1fr]">
        <MobileTopBar
          rightAction={<Link aria-label="返回主页" className="mobile-topbar__action" href="/">关闭</Link>}
          title="成她宣言"
        />

        <section className="philosophy-page__scroll">
          <div className="philosophy-page__hero">
            <span className="page-kicker">Chengta Manifesto</span>
            <h1>不需要变成谁，<br />只是慢慢回到自己。</h1>
            <div>
              {manifestoLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="philosophy-page__sections">
            {cards.map((section, index) => (
              <details className="philosophy-page__section" key={section.title} open={index < 2}>
                <summary>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h2>{section.title.replace(/^[一二三四五六七八九十]+ · /u, "")}</h2>
                  <em aria-hidden>{philosophyIcons[index % philosophyIcons.length]}</em>
                  <i>展开</i>
                </summary>
                <div>
                  {section.blocks.map((block, blockIndex) => renderBlock(block, `${section.title}-${blockIndex}`))}
                </div>
              </details>
            ))}
          </div>

          <section className="philosophy-page__closing">
            <span aria-hidden>✦</span>
            <p>回到自己，就是最大的力量。</p>
            <Link className="action-primary" href="/assessment/profile">开始测评</Link>
            <Link className="philosophy-page__home-link" href="/">回到首页</Link>
            <small>100天不是为了改变你，而是为了成就你</small>
          </section>
        </section>
      </section>
    </main>
  );
}

const philosophyIcons = ["✦", "☾", "◇", "🌿", "♡", "✿", "⌁"];

function groupSections(blocks: MarkdownBlock[]) {
  const sections: PhilosophySection[] = [];
  let current: PhilosophySection | null = null;

  for (const block of blocks) {
    if (block.type === "heading" && block.level === 2) {
      current = { blocks: [], title: block.text };
      sections.push(current);
      continue;
    }
    if (!current || (block.type === "heading" && block.level === 1)) continue;
    current.blocks.push(block);
  }

  return sections;
}

function renderBlock(block: MarkdownBlock, key: string) {
  if (block.type === "heading") {
    return <h3 key={key}>{block.text.replace(/^\d+\s*·\s*/u, "")}</h3>;
  }
  if (block.type === "quote") {
    return <blockquote key={key}>{block.text}</blockquote>;
  }
  return <p key={key}>{block.text}</p>;
}
