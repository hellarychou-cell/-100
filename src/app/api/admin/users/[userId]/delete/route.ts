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
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    const normalized = error.message.toLowerCase();
    const canDeleteProfileOnly =
      normalized.includes("not found") ||
      normalized.includes("does not exist") ||
      normalized.includes("user not");

    if (!canDeleteProfileOnly) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
