"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { clearLocalUser, setLocalUser } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [message, setMessage] = useState("配置 Supabase 后会使用真实账号；本地未配置时会进入演示账号。");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const phone = String(form.get("phone") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const displayName = String(form.get("name") ?? "她").trim() || "她";

    if (!phone || !password || (isRegister && !displayName)) {
      setMessage("请把手机号、密码和昵称填写完整。");
      setLoading(false);
      return;
    }

    try {
      if (isSupabaseConfigured && supabase) {
        if (isRegister) {
          const { data, error } = await supabase.auth.signUp({
            phone,
            password,
            options: { data: { display_name: displayName, phone } },
          });
          if (error) throw error;
          if (data.user) {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              phone,
              display_name: displayName,
            });
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({ phone, password });
          if (error) throw error;
        }
      } else {
        setLocalUser({
          id: `local-${phone}`,
          phone,
          displayName,
          isMember: phone.endsWith("9999"),
          membershipExpiresAt: phone.endsWith("9999") ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined,
        });
      }

      router.push("/home");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败，请检查手机号和密码。");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    clearLocalUser();
    if (supabase) await supabase.auth.signOut();
    setMessage("已清除当前登录状态。");
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 border border-[var(--line)] sans text-sm">
        <Link className={`p-3 text-center ${isRegister ? "" : "bg-ink text-soft"}`} href="/auth?mode=login">
          登录
        </Link>
        <Link className={`p-3 text-center ${isRegister ? "bg-ink text-soft" : ""}`} href="/auth?mode=register">
          注册
        </Link>
      </div>
      <div className="grid gap-3">
        {isRegister ? <Field label="姓名 / 昵称" name="name" placeholder="写一个你喜欢的称呼" /> : null}
        <Field label="手机号" name="phone" placeholder="用于后台开通会员" />
        <Field label="密码" name="password" placeholder="请输入密码" type="password" />
      </div>
      <button className="action-primary disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "正在处理..." : isRegister ? "注册并进入我的100天" : "登录并进入我的100天"}
      </button>
      <p className="m-0 sans text-xs leading-relaxed text-[var(--muted)]">{message}</p>
      <button className="text-link w-max" onClick={handleLogout} type="button">
        退出当前账号
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="grid gap-1 border border-[var(--line)] bg-soft/70 p-3 sans text-sm text-[var(--muted)]">
      <span className="text-[11px] uppercase tracking-wider text-clay">{label}</span>
      <input
        className="w-full bg-transparent text-ink outline-none placeholder:text-[var(--muted)]/55"
        name={name}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}
