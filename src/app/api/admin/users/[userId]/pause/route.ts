import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(_req: NextRequest, context: RouteContext) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { userId } = await context.params;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

  const expiresAt = latest?.expires_at ?? new Date(Date.now() + 30 * 86400000).toISOString();
  const query = latest
    ? supabase.from("memberships").update({ ai_paused: true }).eq("id", latest.id)
    : supabase.from("memberships").insert({ user_id: userId, expires_at: expiresAt, ai_paused: true });
  const { error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, expires_at: expiresAt });
}
