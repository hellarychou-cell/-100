"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { clearLocalUser, setLocalUser } from "@/lib/auth";
import { buildPhoneAuthIdentity } from "@/lib/phone-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [message, setMessage] = useState("配置 Supabase 后会使用真实账号；本地未配置时会进入演示账号。");
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

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

    if (isRegister && password !== confirmPassword) {
      setMessage("两次输入的密码不一致。");
      setLoading(false);
      return;
    }

    try {
      const { authEmail, storedPhone } = buildPhoneAuthIdentity(phone);

      if (isSupabaseConfigured && supabase) {
        if (isRegister) {
          const { data, error } = await supabase.auth.signUp({
            email: authEmail,
            password,
            options: { data: { display_name: displayName, phone: storedPhone } },
          });
          if (error) throw error;
          if (data.user) {
            const { error: profileError } = await supabase.from("profiles").upsert({
              id: data.user.id,
              phone: storedPhone,
              display_name: displayName,
            });
            if (profileError) throw profileError;
          }
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
          if (error) throw error;
        }
      } else {
        setLocalUser({
          id: `local-${storedPhone}`,
          phone: storedPhone,
          displayName,
          isMember: storedPhone.endsWith("9999"),
          membershipExpiresAt: storedPhone.endsWith("9999") ? new Date(Date.now() + 30 * 86400000).toISOString() : undefined,
        });
      }

      router.push("/home");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败，请检查手机号和密码。");
    } finally {
      setLoading(false);
    }
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
        {isRegister && <Field label="姓名 / 昵称" name="name" placeholder="写一个你喜欢的称呼" />}
        <Field label="手机号" name="phone" placeholder="用于后台开通会员" />
        <Field label="密码" name="password" placeholder="请输入密码" type="password" />
        {isRegister && <Field label="确认密码" name="confirmPassword" placeholder="再次输入密码" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />}
      </div>
      <button className="action-primary disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "正在处理..." : isRegister ? "注册并进入我的100天" : "登录并进入我的100天"}
      </button>
      <p className="m-0 sans text-xs leading-relaxed text-[var(--muted)]">{message}</p>
      {!isRegister && (
        <div className="flex justify-end">
          <Link className="text-link text-xs" href="/auth/forgot-password">
            忘记密码
          </Link>
        </div>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="grid gap-1 border border-[var(--line)] bg-soft/70 p-3 sans text-sm text-[var(--muted)]">
      <span className="text-[11px] uppercase tracking-wider text-clay">{label}</span>
      <input
        className="w-full bg-transparent text-ink outline-none placeholder:text-[var(--muted)]/55"
        name={name}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={onChange}
      />
    </label>
  );
}