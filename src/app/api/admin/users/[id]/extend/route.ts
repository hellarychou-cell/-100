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

  const newExpires = new Date(Date.now() + 30 * 86400000).toISOString();

  const { data, error } = await supabase
    .from("memberships")
    .insert({ user_id: id, starts_at: new Date().toISOString(), expires_at: newExpires })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, expires_at: data.expires_at });
}