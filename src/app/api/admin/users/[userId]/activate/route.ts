import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/admin-supabase";

const BUYOUT_DAYS = 100;

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

  const expiresAt = new Date(Date.now() + BUYOUT_DAYS * 86400000).toISOString();
  const query = latest
    ? supabase.from("memberships").update({ expires_at: expiresAt, ai_paused: false }).eq("id", latest.id)
    : supabase.from("memberships").insert({ user_id: userId, expires_at: expiresAt, ai_paused: false });
  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, expires_at: expiresAt });
}
