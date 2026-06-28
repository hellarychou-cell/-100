import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getCalendarCurrentDay } from "@/lib/progress";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type ProfileRow = {
  id: string;
  display_name: string | null;
  phone: string | null;
  created_at?: string | null;
};

type ProgressRow = {
  current_day: number | null;
  journey_start_date?: string | null;
  journey_start_day?: number | null;
};

function getMetaValue(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const [{ data: profiles, error: profilesError }, { data: authData, error: authError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, phone, created_at")
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
      display_name:
        profile?.display_name ??
        getMetaValue(metadata, "display_name") ??
        authUser.email?.split("@")[0] ??
        "她",
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
        day: progress
          ? getCalendarCurrentDay({
              journeyStartDate: progress.journey_start_date,
              journeyStartDay: progress.journey_start_day,
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
    .select("current_day, journey_start_day, journey_start_date")
    .eq("user_id", userId)
    .maybeSingle();

  if (!withJourney.error) return withJourney.data as ProgressRow | null;

  const fallback = await supabase
    .from("progress")
    .select("current_day")
    .eq("user_id", userId)
    .maybeSingle();
  return fallback.data as ProgressRow | null;
}
