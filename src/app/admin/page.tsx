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
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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
    setActionError("");
    try {
      const data = await postAdminAction(`/api/admin/users/${userId}/extend`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, expires: data.expires_at } : u));
    } catch (e) {
      console.error("Failed to extend", e);
      setActionError(e instanceof Error ? e.message : "操作失败，请稍后再试。");
    }
    finally { setActionLoading(null); }
  }

  async function handleReduce(userId: string) {
    setActionLoading(userId);
    setActionError("");
    try {
      const data = await postAdminAction(`/api/admin/users/${userId}/reduce`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, expires: data.expires_at } : u));
    } catch (e) {
      console.error("Failed to reduce", e);
      setActionError(e instanceof Error ? e.message : "操作失败，请稍后再试。");
    }
    finally { setActionLoading(null); }
  }

  async function handlePause(userId: string) {
    setActionLoading(userId);
    setActionError("");
    try {
      await postAdminAction(`/api/admin/users/${userId}/pause`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, aiPaused: true } : u));
    } catch (e) {
      console.error("Failed to pause", e);
      setActionError(e instanceof Error ? e.message : "操作失败，请稍后再试。");
    }
    finally { setActionLoading(null); }
  }

  async function handleDelete(userId: string) {
    setActionLoading(userId);
    setActionError("");
    try {
      await postAdminAction(`/api/admin/users/${userId}/delete`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (selectedUserId === userId) setSelectedUserId(null);
    } catch (e) {
      console.error("Failed to delete", e);
      setActionError(e instanceof Error ? e.message : "操作失败，请稍后再试。");
    }
    finally { setActionLoading(null); setDeleteConfirm(null); }
  }

  function formatExpires(expires: string | null) {
    if (!expires) return "未开通";
    const d = new Date(expires);
    const now = new Date();
    if (d < now) return "已到期";
    return d.toLocaleDateString("zh-CN");
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = normalizedSearch
    ? users.filter((user) => {
        const searchable = [
          user.name,
          user.phone,
          user.assessment,
          user.day ? `day ${user.day}` : "未开始",
          formatExpires(user.expires),
          user.aiPaused ? "AI 已暂停" : "AI 可使用",
        ].join(" ").toLowerCase();
        return searchable.includes(normalizedSearch);
      })
    : users;

  if (!isAuthenticated) return <AdminLoginForm onSuccess={() => setIsAuthenticated(true)} />;

  return (
    <main className="viewport botanical-page admin-viewport">
      <section className="paper-frame mobile-app-shell admin-mobile-shell">
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
          <section className="admin-search-panel">
            <label className="admin-search">
              <span>搜索</span>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索姓名、手机号、测评状态或 Day"
                type="search"
              />
            </label>
            <p>{filteredUsers.length} / {users.length} 位用户</p>
          </section>
          {actionError ? <p className="admin-action-error">{actionError}</p> : null}
          <section className="admin-user-list thin-panel">
            <div className="admin-user-table__head">
              <span>快速概览</span>
              <span>点开用户即可操作</span>
            </div>
            {loading ? (
              <div className="thin-panel p-6 text-center text-clay sans text-sm">加载中...</div>
            ) : loadError ? (
              <div className="thin-panel p-6 text-center text-clay sans text-sm">{loadError}</div>
            ) : users.length === 0 ? (
              <div className="thin-panel p-6 text-center text-clay sans text-sm">暂无用户</div>
            ) : filteredUsers.length === 0 ? (
              <div className="thin-panel p-6 text-center text-clay sans text-sm">没有找到匹配用户</div>
            ) : (
              <div className="admin-user-list__scroll" aria-label="用户状态列表">
                {filteredUsers.map((user) => {
                  const originalIndex = users.findIndex((item) => item.id === user.id);
                  const isSelected = selectedUserId === user.id;
                  return (
                    <div key={user.id} className="admin-user-list__item">
                      <button
                        className={`admin-user-row ${isSelected ? "admin-user-row--active" : ""}`}
                        type="button"
                        onClick={() => setSelectedUserId(isSelected ? null : user.id)}
                      >
                        <span className="admin-user-row__name">
                          <b>{originalIndex + 1}</b>
                          {user.name}
                        </span>
                        <span>{user.day ? `Day ${String(user.day).padStart(2, "0")}` : "未开始"}</span>
                        <span>{user.assessment}</span>
                      </button>
                      {isSelected && (
                        <AdminUserActionCard
                          user={user}
                          actionLoading={actionLoading}
                          formatExpires={formatExpires}
                          onExtend={handleExtend}
                          onReduce={handleReduce}
                          onPause={handlePause}
                          onDelete={() => setDeleteConfirm(user.id)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
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

async function postAdminAction(url: string) {
  const res = await fetch(url, { method: "POST" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || "后台操作失败。");
  }
  return data;
}

function AdminUserActionCard({
  user,
  actionLoading,
  formatExpires,
  onExtend,
  onReduce,
  onPause,
  onDelete,
}: {
  user: AdminUser;
  actionLoading: string | null;
  formatExpires: (expires: string | null) => string;
  onExtend: (userId: string) => void;
  onReduce: (userId: string) => void;
  onPause: (userId: string) => void;
  onDelete: () => void;
}) {
  return (
    <article className="admin-user-card admin-user-card--expanded">
      <div className="admin-user-card__header">
        <div>
          <h2>{user.name}</h2>
          <p>{user.phone}</p>
        </div>
        <span className="pill">{user.assessment}</span>
      </div>
      <div className="admin-user-card__chips">
        <InfoChip label="当前" value={user.day ? `Day ${String(user.day).padStart(2, "0")}` : "未开始"} />
        <InfoChip label="会员" value={formatExpires(user.expires)} />
        <InfoChip label="AI" value={user.aiPaused ? "已暂停" : "可使用"} />
      </div>
      {user.assessmentDate && (
        <p className="admin-user-card__meta">测评：{new Date(user.assessmentDate).toLocaleDateString("zh-CN")}</p>
      )}
      <div className="admin-user-card__actions">
        {user.assessment === "已完成" && (
          <Link className="admin-mini-button admin-mini-button--primary" href={`/admin/users/${user.id}`} title="查看测评报告">查看测评报告</Link>
        )}
        <button className="admin-mini-button" onClick={() => onExtend(user.id)} disabled={actionLoading === user.id} title="加30天">+30天</button>
        <button className="admin-mini-button" onClick={() => onReduce(user.id)} disabled={actionLoading === user.id} title="减30天">-30天</button>
        <button className="admin-mini-button" onClick={() => onPause(user.id)} disabled={actionLoading === user.id || user.aiPaused}>{user.aiPaused ? "已暂停" : "暂停AI"}</button>
        <button className="admin-mini-button admin-mini-button--danger" onClick={onDelete} disabled={actionLoading === user.id}>删除</button>
      </div>
    </article>
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
