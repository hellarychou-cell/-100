import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/admin-supabase";

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(_req: NextRequest, context: RouteContext) {
  const { supabase, error: configError } = createAdminSupabaseClient();
  if (!supabase) {
    return NextResponse.json({ error: configError }, { status: 500 });
  }

  const { userId } = await context.params;
  const { data: latest, error: latestError } = await supabase
    .from("memberships")
    .select("id, expires_at")
    .eq("user_id", userId)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return NextResponse.json({ error: latestError.message }, { status: 500 });
  }
  if (!latest) {
    return NextResponse.json({ error: "该用户还没有会员记录，请先开通100天。" }, { status: 404 });
  }

  const { error } = await supabase.from("memberships").update({ ai_paused: true }).eq("id", latest.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, expires_at: latest.expires_at });
}
