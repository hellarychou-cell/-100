import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/admin-supabase";
import { getClickDrivenCurrentDay } from "@/lib/progress";

type ProfileRow = {
  age: string | null;
  id: string;
  display_name: string | null;
  identity: string | null;
  current_issue: string | null;
  ideal_state: string | null;
  phone: string | null;
  created_at?: string | null;
};

type ProgressRow = {
  current_day: number | null;
  completed_days?: number[] | null;
  journey_start_date?: string | null;
  journey_start_day?: number | null;
  next_unlock_date?: string | null;
};

function getMetaValue(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

export async function GET() {
  const { error: configError, supabase } = createAdminSupabaseClient();
  if (configError || !supabase) {
    return NextResponse.json({ error: configError }, { status: 500 });
  }

  const [{ data: profiles, error: profilesError }, { data: authData, error: authError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, phone, age, identity, current_issue, ideal_state, created_at")
      .order("created_at", { ascending: false }),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 500 });
  }

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile as ProfileRow]));
  const mergedProfiles = new Map<string, ProfileRow>();

  for (const authUser of authData.users) {
    const profile = profileMap.get(authUser.id);
    const metadata = authUser.user_metadata as Record<string, unknown> | null;
    mergedProfiles.set(authUser.id, {
      id: authUser.id,
      age: profile?.age ?? null,
      current_issue: profile?.current_issue ?? null,
      display_name:
        profile?.display_name ??
        getMetaValue(metadata, "display_name") ??
        authUser.email?.split("@")[0] ??
        "她",
      identity: profile?.identity ?? null,
      ideal_state: profile?.ideal_state ?? null,
      phone:
        profile?.phone ??
        getMetaValue(metadata, "phone") ??
        authUser.phone ??
        "",
      created_at: profile?.created_at ?? authUser.created_at,
    });
  }

  for (const profile of profiles ?? []) {
    if (!mergedProfiles.has(profile.id)) {
      mergedProfiles.set(profile.id, profile as ProfileRow);
    }
  }

  const users = await Promise.all(
    Array.from(mergedProfiles.values()).map(async (profile) => {
      const [{ data: membership }, { data: assessment }, progress] =
        await Promise.all([
          supabase
            .from("memberships")
            .select("expires_at, ai_paused")
            .eq("user_id", profile.id)
            .order("expires_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("assessments")
            .select("id, created_at")
            .eq("user_id", profile.id)
            .limit(1)
            .maybeSingle(),
          loadProgress(supabase, profile.id),
        ]);

      return {
        id: profile.id,
        name: profile.display_name || "她",
        phone: profile.phone || "未填写",
        profileDetails: {
          age: profile.age,
          currentIssue: profile.current_issue,
          identity: profile.identity,
          idealState: profile.ideal_state,
          name: profile.display_name,
        },
        day: progress
          ? getClickDrivenCurrentDay({
              completedDays: Array.isArray(progress.completed_days) ? progress.completed_days : [],
              journeyStartDate: progress.journey_start_date,
              journeyStartDay: progress.journey_start_day,
              nextUnlockDate: progress.next_unlock_date,
              savedDay: progress.current_day,
            })
          : null,
        assessment: assessment ? "已完成" : "未测评",
        assessmentDate: assessment?.created_at ?? null,
        expires: membership?.expires_at ?? null,
        aiPaused: membership?.ai_paused ?? false,
      };
    }),
  );

  return NextResponse.json({ users });
}

async function loadProgress(
  supabase: SupabaseClient,
  userId: string,
) {
  const withJourney = await supabase
    .from("progress")
    .select("current_day, completed_days, journey_start_day, journey_start_date, next_unlock_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (!withJourney.error) return withJourney.data as ProgressRow | null;

  const fallback = await supabase
    .from("progress")
    .select("current_day, completed_days")
    .eq("user_id", userId)
    .maybeSingle();
  return fallback.data as ProgressRow | null;
}
