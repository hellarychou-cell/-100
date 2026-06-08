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

  // Delete memberships first (foreign key constraint)
  await supabase.from("memberships").delete().eq("user_id", id);
  // Delete assessments
  await supabase.from("assessments").delete().eq("user_id", id);
  // Delete progress
  await supabase.from("progress").delete().eq("user_id", id);
  // Delete checkins
  await supabase.from("checkins").delete().eq("user_id", id);
  // Delete profile
  const { error: profileError } = await supabase.from("profiles").delete().eq("id", id);
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Delete auth user
  await supabase.auth.admin.deleteUser(id);

  return NextResponse.json({ success: true });
}