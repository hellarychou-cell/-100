"use client";

import Link from "next/link";
import { useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      setMessage("请输入手机号。");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setMessage(data.error || "发送失败，请稍后重试。");
      }
    } catch {
      setMessage("网络错误，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="viewport grid place-items-center">
      <section className="relative grid w-full max-w-3xl grid-cols-[.82fr_1fr] overflow-hidden border border-paper/50 bg-soft text-ink shadow-2xl max-md:grid-cols-1">
        <Link
          aria-label="返回登录"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center border border-[var(--line)] bg-soft/80 text-lg leading-none transition hover:bg-ink hover:text-soft"
          href="/auth?mode=login"
        >
          ×
        </Link>
        <aside className="grid border-r border-[var(--line)] bg-paper/60 p-8 max-md:border-b max-md:border-r-0">
          <div className="text-xl">成她100</div>
          <h1 className="my-12 text-5xl font-normal leading-[.9] max-md:my-6">
            找回
            <br />
            你的密码。
          </h1>
          <p className="m-0 leading-[1.8] text-[#563a2e]">
            输入注册时使用的手机号，我们会发送一封密码重置邮件到你的账号邮箱。
          </p>
        </aside>
        <section className="p-8">
          {done ? (
            <div className="grid gap-5">
              <div className="rounded-md border border-green-300 bg-green-50 p-4 text-green-800">
                <p className="font-medium">📧 邮件已发送</p>
                <p className="mt-1 text-sm">
                  密码重置链接已发送到你的账号邮箱，请查收。如果没收到邮件，请检查垃圾箱或稍后重试。
                </p>
              </div>
              <Link className="action-primary text-center" href="/auth?mode=login">
                返回登录
              </Link>
            </div>
          ) : (
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-3">
                <label className="grid gap-1 border border-[var(--line)] bg-soft/70 p-3 sans text-sm text-[var(--muted)]">
                  <span className="text-[11px] uppercase tracking-wider text-clay">手机号</span>
                  <input
                    className="w-full bg-transparent text-ink outline-none placeholder:text-[var(--muted)]/55"
                    type="tel"
                    placeholder="注册时使用的手机号"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                  />
                </label>
              </div>
              {message && <p className="m-0 text-sm text-clay">{message}</p>}
              <button className="action-primary disabled:opacity-60" disabled={loading} type="submit">
                {loading ? "正在发送..." : "发送重置邮件"}
              </button>
              {!isSupabaseConfigured && (
                <p className="m-0 text-xs text-[var(--muted)]">
                  本地模式：演示账号无法发送真实邮件，请联系管理员。
                </p>
              )}
              <Link className="text-link text-xs" href="/auth?mode=login">
                返回登录
              </Link>
            </form>
          )}
        </section>
      </section>
    </main>
  );
}