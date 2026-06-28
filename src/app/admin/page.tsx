"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

const ADMIN_SESSION_KEY = "chengta_admin_session";

type AdminUser = {
  id: string;
  name: string;
  phone: string;
  day: number | null;
  assessment: string;
  assessmentDate: string | null;
  expires: string | null;
  aiPaused: boolean;
};

function AdminLoginForm({ onSuccess }: { onSuccess: () => void }) {
  const ADMIN_NAME = process.env.NEXT_PUBLIC_ADMIN_NAME || "周馨怡";
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "zxy19941210";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() === ADMIN_NAME && password === ADMIN_PASSWORD) {
      window.localStorage.setItem(ADMIN_SESSION_KEY, "true");
      onSuccess();
    } else {
      setError("姓名或密码错误，请重新输入。");
    }
  }

  return (
    <main className="viewport grid place-items-center">
      <section className="paper-frame grid w-full max-w-sm gap-6 p-10 text-center">
        <div>
          <div className="eyebrow mb-3">Admin access</div>
          <h1 className="display-title text-5xl">后台入口</h1>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1 border border-[var(--line)] bg-soft/70 p-3 text-left">
            <span className="text-[11px] uppercase tracking-wider text-clay">姓名</span>
            <input className="w-full bg-transparent text-ink outline-none" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入姓名" autoComplete="username" />
          </label>
          <label className="grid gap-1 border border-[var(--line)] bg-soft/70 p-3 text-left">
            <span className="text-[11px] uppercase tracking-wider text-clay">密码</span>
            <input className="w-full bg-transparent text-ink outline-none" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" autoComplete="current-password" />
          </label>
          {error && <p className="text-sm text-clay">{error}</p>}
          <button className="action-primary" type="submit">进入后台</button>
        </form>
        <Link className="text-link" href="/">返回首页</Link>
      </section>
    </main>
  );
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(ADMIN_SESSION_KEY) === "true";
  });
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "后台用户列表加载失败。");
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error("Failed to fetch users", e);
      setLoadError(e instanceof Error ? e.message : "后台用户列表加载失败。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchUsers();
  }, [isAuthenticated, fetchUsers]);

  function handleLogout() {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
  }

  async function handleExtend(userId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/extend`, { method: "POST" });
      const data = await res.json();
      if (data.success) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, expires: data.expires_at } : u));
    } catch (e) { console.error("Failed to extend", e); }
    finally { setActionLoading(null); }
  }

  async function handleReduce(userId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/reduce`, { method: "POST" });
      const data = await res.json();
      if (data.success) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, expires: data.expires_at } : u));
    } catch (e) { console.error("Failed to reduce", e); }
    finally { setActionLoading(null); }
  }

  async function handlePause(userId: string) {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/pause`, { method: "POST" });
      const data = await res.json();
      if (data.success) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, aiPaused: true } : u));
    } catch (e) { console.error("Failed to pause", e); }
    finally { setActionLoading(null); }
  }

  async function handleDelete(userId: string) {
    if (!confirm("确定要删除该用户吗？此操作不可撤销。")) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/delete`, { method: "POST" });
      const data = await res.json();
      if (data.success) setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) { console.error("Failed to delete", e); }
    finally { setActionLoading(null); setDeleteConfirm(null); }
  }

  function formatExpires(expires: string | null) {
    if (!expires) return "未开通";
    const d = new Date(expires);
    const now = new Date();
    if (d < now) return "已到期";
    return d.toLocaleDateString("zh-CN");
  }

  if (!isAuthenticated) return <AdminLoginForm onSuccess={() => setIsAuthenticated(true)} />;

  return (
    <main className="viewport botanical-page">
      <section className="paper-frame mobile-app-shell">
        <header className="topbar mobile-topbar">
          <div className="brand">成她100 · 后台</div>
          <span>后台管理</span>
          <button className="text-link" onClick={handleLogout} type="button">退出登录</button>
        </header>
        <section className="grid gap-4 p-5">
          <div className="treasure-hero">
            <p className="eyebrow">Admin Console</p>
            <h1>用户后台</h1>
            <p>查看测评、开通会员、暂停 AI 与管理用户状态。</p>
          </div>
          <section className="grid gap-3">
            {loading ? (
              <div className="thin-panel p-6 text-center text-clay sans text-sm">加载中...</div>
            ) : loadError ? (
              <div className="thin-panel p-6 text-center text-clay sans text-sm">{loadError}</div>
            ) : users.length === 0 ? (
              <div className="thin-panel p-6 text-center text-clay sans text-sm">暂无用户</div>
            ) : (
              users.map((user, index) => (
                <article key={user.id} className="thin-panel grid gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-sage text-sm text-white">{index + 1}</span>
                        <h2 className="m-0 text-2xl font-normal">{user.name}</h2>
                      </div>
                      <p className="m-0 mt-1 sans text-xs text-[var(--muted)]">{user.phone}</p>
                    </div>
                    <span className="pill">{user.assessment}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sans text-xs text-[var(--muted)]">
                    <InfoChip label="当前" value={user.day ? `Day ${String(user.day).padStart(2, "0")}` : "未开始"} />
                    <InfoChip label="会员" value={formatExpires(user.expires)} />
                    <InfoChip label="AI" value={user.aiPaused ? "已暂停" : "可使用"} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {user.assessment === "已完成" && (
                      <a className="admin-mini-button admin-mini-button--primary" href={`/admin/users/${user.id}`} title="查看报告">报告</a>
                    )}
                    <button className="admin-mini-button" onClick={() => handleExtend(user.id)} disabled={actionLoading === user.id} title="加30天">+30天</button>
                    <button className="admin-mini-button" onClick={() => handleReduce(user.id)} disabled={actionLoading === user.id} title="减30天">-30天</button>
                    <button className="admin-mini-button" onClick={() => handlePause(user.id)} disabled={actionLoading === user.id || user.aiPaused}>{user.aiPaused ? "已暂停" : "暂停"}</button>
                    <button className="admin-mini-button admin-mini-button--danger" onClick={() => setDeleteConfirm(user.id)} disabled={actionLoading === user.id}>删除</button>
                  </div>
                </article>
              ))
            )}
          </section>
          <section className="grid gap-3">
            <ContentLink title="Day 内容" detail="Day 1-7 已上线，Day 8-100 待补" href="/admin/content" />
            <ContentLink title="测评题库" detail="42 题 · 6维度 × 7题" href="/admin/content" />
            <ContentLink title="神秘卡" detail="女性力量卡与今日卡" href="/admin/content" />
          </section>
        </section>

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 backdrop-blur-sm">
            <div className="thin-panel w-full max-w-sm p-8 text-center">
              <h2 className="mb-3 text-2xl font-normal">确认删除</h2>
              <p className="mb-6 text-[#563a2e]">删除后无法恢复，确定吗？</p>
              <div className="grid grid-cols-2 gap-3">
                <button className="border border-ink px-4 py-2" onClick={() => setDeleteConfirm(null)}>取消</button>
                <button className="bg-red-500 px-4 py-2 text-white hover:bg-red-600" onClick={() => handleDelete(deleteConfirm)}>确认删除</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-soft/60 p-2">
      <span className="block text-[10px] text-clay">{label}</span>
      <strong className="mt-1 block truncate font-normal text-ink">{value}</strong>
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
