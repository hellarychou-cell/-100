"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { getLocalUser, isMembershipActive, LocalUser, LOCAL_RESULT_KEY } from "@/lib/auth";
import { requiresMembershipForDay } from "@/lib/progress";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type GateState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "inactive"; userName: string }
  | { status: "active"; userName: string };

export function AuthGate({
  children,
  day,
  requireMember = true,
}: {
  children: ReactNode;
  day?: number;
  requireMember?: boolean;
}) {
  const [state, setState] = useState<GateState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (!user) {
          if (!cancelled) setState(fallbackLocalUser({ day, requireMember }));
          return;
        }

        const displayName = String(user.user_metadata?.display_name ?? user.phone ?? "她");
        const effectiveRequireMember = day
          ? requiresMembershipForDay(day, await getSupabaseRecommendedDay(user.id))
          : requireMember;

        if (!effectiveRequireMember) {
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
        const freeThroughDay = getLocalRecommendedDay();
        const effectiveRequireMember = day ? requiresMembershipForDay(day, freeThroughDay) : requireMember;
        setState(!effectiveRequireMember || localUser.isMember ? activeLocal(localUser) : { status: "inactive", userName: localUser.displayName });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [day, requireMember]);

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
        text="请添加管理员微信：tianxin0995，联系开通后面的内容。开通后再回来，这里的内容会继续为你保留。"
        action={<Link className="action-primary" href="/">回到主页</Link>}
      />
    );
  }

  return <>{children}</>;
}

function activeLocal(user: LocalUser): GateState {
  return { status: "active", userName: user.displayName };
}

function fallbackLocalUser({
  day,
  requireMember,
}: {
  day?: number;
  requireMember: boolean;
}): GateState {
  const localUser = getLocalUser();
  if (!localUser) return { status: "signed-out" };

  const effectiveRequireMember = day ? requiresMembershipForDay(day, getLocalRecommendedDay()) : requireMember;
  if (!effectiveRequireMember || localUser.isMember) return activeLocal(localUser);
  return { status: "inactive", userName: localUser.displayName };
}

async function getSupabaseRecommendedDay(userId: string) {
  if (!supabase) return 1;
  const { data } = await supabase
    .from("assessments")
    .select("recommended_day")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return typeof data?.recommended_day === "number" ? data.recommended_day : 1;
}

function getLocalRecommendedDay() {
  if (typeof window === "undefined") return 1;
  const raw = window.localStorage.getItem(LOCAL_RESULT_KEY);
  if (!raw) return 1;
  try {
    const parsed = JSON.parse(raw) as { result?: { recommendedDay?: number } };
    return typeof parsed.result?.recommendedDay === "number" ? parsed.result.recommendedDay : 1;
  } catch {
    return 1;
  }
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
