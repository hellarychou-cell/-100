"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getLocalUser, setLocalUser } from "@/lib/auth";
import { buildPhoneAuthIdentity } from "@/lib/phone-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type FormMode = "login" | "register";

export function AuthForm({ mode: initialMode }: { mode: FormMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>(initialMode);
  const isRegister = mode === "register";

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(
    isSupabaseConfigured
      ? ""
      : "本地模式：演示账号手机尾号9999会自动开通会员。",
  );
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const trimmedPhone = phone.trim();
    const trimmedName = displayName.trim() || "她";

    if (!trimmedPhone || !password) {
      setMessage("请填写手机号和密码。");
      setLoading(false);
      return;
    }

    if (isRegister) {
      if (!trimmedName) {
        setMessage("请填写姓名/昵称。");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setMessage("两次密码不一致，请重新输入。");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setMessage("密码至少需要6位。");
        setLoading(false);
        return;
      }
    }

    try {
      const { authEmail, storedPhone } = buildPhoneAuthIdentity(trimmedPhone);

      if (isSupabaseConfigured && supabase) {
        if (isRegister) {
          const { data, error } = await supabase.auth.signUp({
            email: authEmail,
            password,
            options: { data: { display_name: trimmedName, phone: storedPhone } },
          });
          if (error) throw error;
          if (data.user) {
            const { error: profileError } = await supabase.from("profiles").upsert({
              id: data.user.id,
              phone: storedPhone,
              display_name: trimmedName,
            });
            if (profileError) throw profileError;
          }
          setShowSuccess(true);
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
          if (error) {
            setMessage("用户名或者密码不对。");
            setLoading(false);
            return;
          }
          await redirectAfterLogin();
        }
      } else {
        if (isRegister) {
          setLocalUser({
            id: `local-${storedPhone}`,
            phone: storedPhone,
            displayName: trimmedName,
            isMember: storedPhone.endsWith("9999"),
            membershipExpiresAt: storedPhone.endsWith("9999")
              ? new Date(Date.now() + 30 * 86400000).toISOString()
              : undefined,
          });
          setShowSuccess(true);
        } else {
          const localUser = getLocalUser();
          if (!localUser || localUser.phone !== storedPhone || localUser.displayName !== trimmedName) {
            setMessage("用户名或者密码不对。");
            setLoading(false);
            return;
          }
          setLocalUser({ ...localUser, displayName: trimmedName });
          router.push("/home");
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "";
      if (isRegister && msg.includes("already")) {
        setMessage("该手机号已注册，请直接登录。");
      } else if (!isRegister && msg.includes("Invalid")) {
        setMessage("用户名或者密码不对。");
      } else {
        setMessage(msg || "操作失败，请稍后重试。");
      }
    } finally {
      setLoading(false);
    }
  }

  async function redirectAfterLogin() {
    if (!supabase) {
      router.push("/home");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push("/home");
      return;
    }
    const { data: assessment } = await supabase
      .from("assessments")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (assessment) {
      router.push("/assessment/result");
    } else {
      router.push("/assessment/profile");
    }
  }

  function handleSwitchMode(newMode: FormMode) {
    setMode(newMode);
    setMessage("");
    setDisplayName("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <>
      {showSuccess && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm">
          <div className="thin-panel w-full max-w-sm p-8 text-center">
            <div className="mb-4 text-5xl">🎉</div>
            <h2 className="mb-3 text-3xl font-normal">恭喜你注册完成</h2>
            <p className="mb-6 text-[#563a2e]">恭喜你加入了100天旅程，现在开始你的觉醒之路。</p>
            <button
              className="action-primary w-full"
              onClick={() => router.push("/home")}
            >
              进入我的100天
            </button>
          </div>
        </div>
      )}

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 border border-[var(--line)] sans text-sm">
          <button
            type="button"
            className={`p-3 text-center ${!isRegister ? "bg-ink text-soft" : ""}`}
            onClick={() => handleSwitchMode("login")}
          >
            登录
          </button>
          <button
            type="button"
            className={`p-3 text-center ${isRegister ? "bg-ink text-soft" : ""}`}
            onClick={() => handleSwitchMode("register")}
          >
            注册
          </button>
        </div>

        <div className="grid gap-3">
          {isRegister && (
            <Field
              label="姓名 / 昵称"
              name="name"
              placeholder="写一个你喜欢的称呼"
              value={displayName}
              onChange={setDisplayName}
            />
          )}
          <Field
            label="手机号"
            name="phone"
            placeholder="用于后台开通会员"
            value={phone}
            onChange={setPhone}
          />
          <Field
            label="密码"
            name="password"
            placeholder={isRegister ? "设置密码（至少6位）" : "请输入密码"}
            type="password"
            value={password}
            onChange={setPassword}
          />
          {isRegister && (
            <Field
              label="确认密码"
              name="confirmPassword"
              placeholder="再输入一次密码"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
            />
          )}
        </div>

        {message && <p className="m-0 text-sm text-clay">{message}</p>}

        <button className="action-primary disabled:opacity-60" disabled={loading} type="submit">
          {loading ? "正在处理..." : isRegister ? "注册并进入我的100天" : "登录并进入我的100天"}
        </button>

        {!isRegister && (
          <div className="flex justify-end">
            <Link className="text-link text-xs" href="/auth/forgot-password">
              忘记密码
            </Link>
          </div>
        )}
      </form>
    </>
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
  value: string;
  onChange: (v: string) => void;
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
        onChange={(e) => onChange(e.target.value)}
        autoComplete={type === "password" ? "current-password" : "off"}
      />
    </label>
  );
}
