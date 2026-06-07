import Link from "next/link";
import { BookStack } from "@/components/BookStack";
import { heroImage } from "@/lib/content";

export default function PublicPage() {
  return (
    <main
      className="viewport bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(90deg,rgba(18,10,7,.9),rgba(18,10,7,.36) 54%,rgba(18,10,7,.78)),url(${heroImage})`,
      }}
    >
      <section className="stage-frame grid grid-rows-[58px_1fr] text-paper">
        <header className="flex items-center justify-between border-b border-paper/30 px-[clamp(18px,3vw,38px)] sans text-xs text-paper/70">
          <div className="font-serif text-[22px] text-paper">成她100</div>
          <nav className="sans text-[11px] text-paper/55">
            <Link className="border-b border-paper/25 pb-1 transition hover:text-paper" href="/philosophy">
              理念
            </Link>
          </nav>
        </header>

        <section className="grid min-h-0 grid-cols-[minmax(360px,1fr)_minmax(360px,470px)] gap-[clamp(18px,4vw,58px)] px-[clamp(18px,3vw,38px)] py-[clamp(18px,3vw,34px)] max-lg:grid-cols-1 max-lg:overflow-visible">
          <div className="flex min-h-0 flex-col justify-center pb-5 max-lg:pb-0">
            <div className="sans mb-5 text-[11px] uppercase tracking-[0.18em] text-gold">
              A private 100-day edition
            </div>
            <h1 className="display-title text-[clamp(58px,9vw,128px)] text-paper">
              100天，<br />把“她”
              <br />还给她。
            </h1>
            <p className="mt-5 max-w-md text-lg leading-[1.8] text-paper/90 max-sm:text-base">
              温柔藏风骨，安静守情谊。
              <br />
              不需要变成谁，只是慢慢回到自己。
            </p>
          </div>

          <div className="grid min-h-0 content-center gap-4 max-lg:content-start">
            <div className="flex flex-wrap items-center gap-3">
              <Link className="bg-paper px-5 py-3.5 sans text-sm text-ink" href="/auth?mode=login">
                登录
              </Link>
              <Link className="border border-paper/75 bg-paper/10 px-5 py-3.5 sans text-sm" href="/auth?mode=register">
                注册
              </Link>
              <div className="group relative grid h-7 w-7 place-items-center rounded-full border border-paper/70 sans text-xs">
                i
                <div className="absolute bottom-9 left-0 hidden w-64 border border-ink/20 bg-soft p-3 text-left sans text-xs leading-relaxed text-[#5a3a2c] shadow-2xl group-hover:block">
                  登录或注册后，你的测评、知识库、卡片和 AI 对话都会存入“我的匣子”。未登录点击测评，会先完成身份登记。
                </div>
              </div>
            </div>

            <aside className="border border-paper/45 bg-[#120a07]/42 p-[clamp(18px,2.5vw,28px)] shadow-2xl backdrop-blur-md">
              <small className="sans text-[11px] uppercase tracking-[0.16em] text-gold">
                Assessment · 42 questions
              </small>
              <h2 className="mt-3 text-[clamp(34px,4vw,56px)] font-normal leading-[.96] text-paper">
                底层代码诊断
              </h2>
              <p className="mt-4 text-sm leading-[1.8] text-paper/82">
                6 维度 × 7 题，生成你的雷达图、主模式和推荐起点。
              </p>
              <Link className="mt-5 inline-flex bg-paper px-4 py-3 sans text-sm text-ink" href="/assessment/profile">
                开始测评
              </Link>
            </aside>

            <Link
              className="grid grid-cols-[minmax(0,1fr)_180px] items-center gap-4 border border-paper/30 bg-[#120a07]/34 px-5 py-4 backdrop-blur-md transition hover:border-paper/55 hover:bg-[#120a07]/45 max-sm:grid-cols-1"
              href="/knowledge"
            >
              <div>
                <h3 className="m-0 text-[24px] font-normal text-paper">知识库 · 100天内容</h3>
                <p className="mt-2 sans text-xs leading-relaxed text-paper/70">
                  4 个阶段，100 个 Day。每日镜子、故事、身体小语、AI 对话、神秘卡，会按进度慢慢打开。
                </p>
              </div>
              <BookStack />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
