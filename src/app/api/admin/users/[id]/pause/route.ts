import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { id } = await params;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find the latest membership for this user
  const { data: latest, error: findError } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", id)
    .order("expires_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  if (!latest) {
    return NextResponse.json({ error: "No membership found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("memberships")
    .update({ ai_paused: true })
    .eq("id", latest.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}