import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, phone");

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 });
  }

  const users = await Promise.all(
    (profiles ?? []).map(async (profile) => {
      const [{ data: membership }, { data: assessment }, { data: progress }] =
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
          supabase
            .from("progress")
            .select("current_day")
            .eq("user_id", profile.id)
            .maybeSingle(),
        ]);

      return {
        id: profile.id,
        name: profile.display_name,
        phone: profile.phone,
        day: progress?.current_day ?? null,
        assessment: assessment ? "已完成" : "未测评",
        assessmentDate: assessment?.created_at ?? null,
        expires: membership?.expires_at ?? null,
        aiPaused: membership?.ai_paused ?? false,
      };
    }),
  );

  return NextResponse.json({ users });
}