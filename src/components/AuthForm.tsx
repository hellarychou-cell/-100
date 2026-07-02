"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getLocalUser, setLocalUser } from "@/lib/auth";
import { normalizeEmail } from "@/lib/password-reset";
import { buildPhoneAuthIdentity, validateLocalRegistrationIdentity } from "@/lib/phone-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type FormMode = "login" | "register";

export function AuthForm({ mode: initialMode }: { mode: FormMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<FormMode>(initialMode);
  const isRegister = mode === "register";

  const [email, setEmail] = useState("");
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
    const trimmedEmail = normalizeEmail(email);

    if (!password || (isRegister && (!trimmedPhone || !trimmedEmail)) || (!isRegister && !trimmedEmail)) {
      setMessage(isRegister ? "请填写邮箱、手机号和密码。" : "请填写邮箱和密码。");
      setLoading(false);
      return;
    }

    if (isRegister) {
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
      const phoneIdentity = isRegister ? buildPhoneAuthIdentity(trimmedPhone) : null;
      const storedPhone = phoneIdentity?.storedPhone ?? "";
      const signInEmail = trimmedEmail;

      if (isSupabaseConfigured && supabase) {
        if (isRegister) {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: trimmedEmail,
              phone: storedPhone,
              password,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data.error || "注册失败，请稍后重试。");
          }
          const { error } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
          if (error) throw error;
          setShowSuccess(true);
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password });
          if (error) {
            setMessage("用户名或者密码不对。");
            setLoading(false);
            return;
          }
          await redirectAfterLogin();
        }
      } else {
        if (isRegister) {
          const identityCheck = validateLocalRegistrationIdentity(getLocalUser(), {
            phone: storedPhone,
            email: trimmedEmail,
          });
          if (!identityCheck.ok) {
            setMessage(identityCheck.message);
            setLoading(false);
            return;
          }
          setLocalUser({
            id: `local-${storedPhone}`,
            phone: storedPhone,
            email: trimmedEmail,
            displayName: "她",
            isMember: storedPhone.endsWith("9999"),
            membershipExpiresAt: storedPhone.endsWith("9999")
              ? new Date(Date.now() + 30 * 86400000).toISOString()
              : undefined,
          });
          setShowSuccess(true);
        } else {
          const localUser = getLocalUser();
          if (!localUser || normalizeEmail(localUser.email ?? "") !== trimmedEmail) {
            setMessage("用户名或者密码不对。");
            setLoading(false);
            return;
          }
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

    // 老用户（有测评结果）直接进主页，新用户进测评页
    if (assessment) {
      router.push("/home");
    } else {
      router.push("/assessment/profile");
    }
  }

  function handleSwitchMode(newMode: FormMode) {
    setMode(newMode);
    setMessage("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <>
      {showSuccess && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="chengta-dialog">
            <span className="chengta-dialog__mark" aria-hidden>✦</span>
            <h2>账号已经建好</h2>
            <p>先完成一次底层代码诊断，<br />让这 100 天更像是在对你说话。</p>
            <button
              className="action-primary w-full"
              onClick={() => router.push("/assessment/profile")}
            >
              开始测评
            </button>
          </div>
        </div>
      )}

      <form className="grid gap-5" onSubmit={handleSubmit}>
        <div className="auth-mode-tabs grid grid-cols-2 border border-clay/20 bg-[#fff8ed]/62 p-1 sans text-sm shadow-inner">
          <button
            type="button"
            className={`p-3 text-center transition ${!isRegister ? "bg-[#D9A07F] text-white shadow-sm" : "text-clay hover:bg-paper/70"}`}
            onClick={() => handleSwitchMode("login")}
          >
            登录
          </button>
          <button
            type="button"
            className={`p-3 text-center transition ${isRegister ? "bg-[#D9A07F] text-white shadow-sm" : "text-clay hover:bg-paper/70"}`}
            onClick={() => handleSwitchMode("register")}
          >
            注册
          </button>
        </div>

        <div className="grid gap-3">
          <Field
            label={isRegister ? "邮箱" : "邮箱"}
            name="email"
            placeholder={isRegister ? "用于找回密码" : "请输入注册邮箱"}
            value={email}
            onChange={setEmail}
          />
          <Field
            label="手机号"
            name="phone"
            placeholder="用于后台开通会员"
            value={phone}
            onChange={setPhone}
            hidden={!isRegister}
          />
          <div className="grid gap-2">
            <Field
              label="密码"
              name="password"
              placeholder={isRegister ? "设置密码（至少6位）" : "请输入密码"}
              type="password"
              value={password}
              onChange={setPassword}
            />
            {!isRegister && (
              <div className="auth-field-action-row">
                <Link className="auth-forgot-link" href="/auth/forgot-password">
                  忘记密码？
                </Link>
              </div>
            )}
          </div>
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

        {message && <p className="m-0 border-l border-clay/40 bg-[#fff8ed]/70 px-3 py-2 text-sm text-clay">{message}</p>}

        <button className="action-primary disabled:opacity-60" disabled={loading} type="submit">
          {loading ? "正在处理..." : isRegister ? "注册并进入我的100天" : "登录并进入我的100天"}
        </button>

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
  hidden = false,
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  hidden?: boolean;
}) {
  if (hidden) return null;

  return (
    <label className="field-shell grid gap-1 p-3 sans text-sm text-[var(--muted)]">
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
