import Link from "next/link";
import { adminUsers } from "@/lib/content";

export default function AdminPage() {
  return (
    <main className="viewport">
      <section className="paper-frame grid grid-rows-[56px_1fr]">
        <header className="topbar">
          <div className="brand">成她100 · 后台</div>
          <span>用户会员 / 内容管理</span>
          <span>管理员</span>
        </header>
        <section className="grid min-h-0 grid-rows-[auto_1fr_auto] gap-4 p-5">
          <div className="flex items-end justify-between gap-4 max-sm:grid">
            <h1 className="m-0 text-4xl font-normal leading-none">用户列表</h1>
            <div className="w-64 border border-[var(--line)] bg-soft/70 p-2.5 sans text-sm text-[var(--muted)] max-sm:w-full">
              搜索手机号 / 姓名
            </div>
          </div>
          <section className="grid min-h-0 grid-rows-[38px_repeat(5,1fr)] overflow-hidden border border-[var(--line)] bg-paper/50 max-lg:block max-lg:overflow-auto">
            <TableHeader />
            {adminUsers.map((user) => (
              <div key={user.phone} className="grid grid-cols-[1.1fr_1fr_.8fr_.8fr_.9fr_170px] items-center border-b border-ink/10 sans text-xs text-[var(--muted)] max-lg:min-w-[860px] max-lg:min-h-12">
                <div className="px-3 font-serif text-lg text-ink">{user.name}</div>
                <div className="px-3">{user.phone}</div>
                <div className="px-3">{user.day}</div>
                <div className="px-3"><span className="pill">{user.assessment}</span></div>
                <div className="px-3">{user.expires}</div>
                <div className="flex gap-2 px-3">
                  <button className="bg-ink px-2 py-1.5 text-soft">加30天</button>
                  <button className="border border-ink px-2 py-1.5 text-ink">暂停</button>
                </div>
              </div>
            ))}
          </section>
          <section className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
            <ContentLink title="Day 内容" detail="Day 1-7 已上线，Day 8-100 待补" href="/admin/content" />
            <ContentLink title="测评题库" detail="42 题 · 6维度 × 7题" href="/admin/content" />
            <ContentLink title="神秘卡" detail="女性力量卡与今日卡" href="/admin/content" />
          </section>
        </section>
      </section>
    </main>
  );
}

function TableHeader() {
  return (
    <div className="grid grid-cols-[1.1fr_1fr_.8fr_.8fr_.9fr_170px] items-center bg-ink/5 sans text-xs text-ink max-lg:min-w-[860px] max-lg:min-h-10">
      {["用户", "手机号", "当前 Day", "测评", "AI 到期", "操作"].map((item) => (
        <div key={item} className="px-3">{item}</div>
      ))}
    </div>
  );
}

function ContentLink({ title, detail, href }: { title: string; detail: string; href: string }) {
  return (
    <Link href={href} className="thin-panel grid grid-cols-[1fr_auto] items-center gap-3 p-4">
      <div>
        <strong className="block text-xl font-normal">{title}</strong>
        <span className="mt-1 block sans text-xs text-[var(--muted)]">{detail}</span>
      </div>
      <span className="pill">管理</span>
    </Link>
  );
}
