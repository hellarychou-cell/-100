"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase";
import { MobileTopBar } from "@/components/MobileTopBar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !phone.trim() || !password) {
      setMessage("请填写邮箱、手机号和新密码。");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("两次输入的新密码不一致。");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setMessage(data.error || "重置失败，请稍后重试。");
      }
    } catch {
      setMessage("网络错误，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="viewport botanical-page grid place-items-center">
      <section className="forgot-password-page">
        <MobileTopBar
          rightAction={<Link className="mobile-topbar__action" href="/auth?mode=login">关闭</Link>}
          title="忘记密码"
        />
        <div className="forgot-password-page__content">
        <aside className="grid border-r border-[var(--line)] bg-paper/60 p-8 max-md:border-b max-md:border-r-0">
          <div className="text-xl">成她100</div>
          <h1 className="my-12 text-5xl font-normal leading-[.9] max-md:my-6">
            重置
            <br />
            你的密码。
          </h1>
          <p className="m-0 leading-[1.8] text-[#563a2e]">
            输入注册时填写的邮箱和手机号。两项都匹配后，就可以设置一个新的登录密码。
          </p>
        </aside>
        <section className="p-8">
          {done ? (
            <div className="grid gap-5">
              <div className="border border-green-300 bg-green-50 p-4 text-green-800">
                <p className="font-medium">密码已重置</p>
                <p className="mt-1 text-sm">现在可以用邮箱和新密码登录。</p>
              </div>
              <Link className="action-primary text-center" href="/auth?mode=login">
                返回登录
              </Link>
            </div>
          ) : (
            <form className="grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-3">
                <Field label="邮箱" value={email} onChange={setEmail} placeholder="注册时填写的邮箱" type="email" />
                <Field label="手机号" value={phone} onChange={setPhone} placeholder="注册时使用的手机号" type="tel" />
                <Field label="新密码" value={password} onChange={setPassword} placeholder="至少6位" type="password" />
                <Field label="确认新密码" value={confirmPassword} onChange={setConfirmPassword} placeholder="再输入一次新密码" type="password" />
              </div>
              {message && <p className="m-0 text-sm text-clay">{message}</p>}
              <button className="action-primary disabled:opacity-60" disabled={loading} type="submit">
                {loading ? "正在重置..." : "确认重置密码"}
              </button>
              {!isSupabaseConfigured && (
                <p className="m-0 text-xs text-[var(--muted)]">
                  本地模式不会修改真实线上账号；线上环境会重置 Supabase 登录密码。
                </p>
              )}
              <Link className="text-link text-xs" href="/auth?mode=login">
                返回登录
              </Link>
            </form>
          )}
        </section>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  onChange,
  placeholder,
  type,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  value: string;
}) {
  return (
    <label className="grid gap-1 border border-[var(--line)] bg-soft/70 p-3 sans text-sm text-[var(--muted)]">
      <span className="text-[11px] uppercase tracking-wider text-clay">{label}</span>
      <input
        className="w-full bg-transparent text-ink outline-none placeholder:text-[var(--muted)]/55"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
