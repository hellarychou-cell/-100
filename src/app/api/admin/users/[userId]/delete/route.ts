import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/admin-supabase";

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(_req: NextRequest, context: RouteContext) {
  const { error: configError, supabase } = createAdminSupabaseClient();
  if (configError || !supabase) {
    return NextResponse.json({ error: configError }, { status: 500 });
  }

  const { userId } = await context.params;
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
