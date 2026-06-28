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
  if (!latest) {
    return NextResponse.json({ error: "该用户还没有会员记录。" }, { status: 404 });
  }

  const expiresAt = new Date(new Date(latest.expires_at).getTime() - 30 * 86400000).toISOString();
  const { error } = await supabase
    .from("memberships")
    .update({ expires_at: expiresAt })
    .eq("id", latest.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, expires_at: expiresAt });
}
