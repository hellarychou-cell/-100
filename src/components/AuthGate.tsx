"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { getLocalUser, isMembershipActive, LocalUser } from "@/lib/auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type GateState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "inactive"; userName: string }
  | { status: "active"; userName: string };

export function AuthGate({ children, requireMember = true }: { children: ReactNode; requireMember?: boolean }) {
  const [state, setState] = useState<GateState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (!user) {
          if (!cancelled) setState({ status: "signed-out" });
          return;
        }

        const displayName = String(user.user_metadata?.display_name ?? user.phone ?? "她");
        if (!requireMember) {
          if (!cancelled) setState({ status: "active", userName: displayName });
          return;
        }

        const { data: membership } = await supabase
          .from("memberships")
          .select("expires_at, ai_paused")
          .eq("user_id", user.id)
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!cancelled) {
          setState(
            isMembershipActive(membership?.expires_at)
              ? { status: "active", userName: displayName }
              : { status: "inactive", userName: displayName },
          );
        }
        return;
      }

      const localUser = getLocalUser();
      if (!localUser) {
        if (!cancelled) setState({ status: "signed-out" });
        return;
      }

      if (!cancelled) {
        setState(localUser.isMember ? activeLocal(localUser) : { status: "inactive", userName: localUser.displayName });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [requireMember]);

  if (state.status === "loading") {
    return <GateNotice title="正在打开你的100天" text="稍等一下，正在确认登录和会员状态。" />;
  }

  if (state.status === "signed-out") {
    return (
      <GateNotice
        title="先登录，再进入这里。"
        text="登录后，测评结果、阅读进度、神秘卡和 AI 对话才会存入你的匣子。"
        action={<Link className="action-primary" href="/auth?mode=login">去登录 / 注册</Link>}
      />
    );
  }

  if (requireMember && state.status === "inactive") {
    return (
      <GateNotice
        title={`${state.userName}，这里等待开通。`}
        text="你已经有账号了。完成私下转账后，管理员会按手机号在后台给你加 30 天会员。"
        action={<Link className="action-primary" href="/">回到主页</Link>}
      />
    );
  }

  return <>{children}</>;
}

function activeLocal(user: LocalUser): GateState {
  return { status: "active", userName: user.displayName };
}

function GateNotice({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return (
    <main className="viewport botanical-page gate-notice grid place-items-center">
      <section className="paper-frame chengta-dialog-shell grid w-full max-w-2xl place-items-center overflow-hidden text-center">
        <div className="chengta-dialog">
          <span className="chengta-dialog__mark" aria-hidden>✦</span>
          <div className="page-kicker mx-auto">Private area</div>
          <h1>{title}</h1>
          <p>{text}</p>
          <div className="flex justify-center">{action}</div>
        </div>
      </section>
    </main>
  );
}
