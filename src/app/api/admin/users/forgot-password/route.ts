import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { phone } = await req.json();
  if (!phone) {
    return NextResponse.json({ error: "手机号不能为空" }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find profile by phone to get user id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("phone", phone)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "未找到该手机号对应的账号" }, { status: 404 });
  }

  // Get user auth email
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id);

  if (authError || !authUser?.user) {
    return NextResponse.json({ error: "无法获取账号信息，请联系管理员" }, { status: 500 });
  }

  const authEmail = authUser.user.email;

  // Send password reset email
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(authEmail);

  if (resetError) {
    return NextResponse.json({ error: resetError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, email: authEmail });
}