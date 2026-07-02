import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { resolveLoginEmail } from "@/lib/login-identity";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return jsonError("登录服务还没有配置好。", 500);
  }

  const body = await req.json().catch(() => null);
  const identifier = String(body?.identifier ?? "");
  const password = String(body?.password ?? "");
  if (!password) {
    return jsonError("请填写密码。");
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const result = await resolveLoginEmail(identifier, async (storedPhone) => {
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id")
      .eq("phone", storedPhone)
      .maybeSingle();

    if (profileError || !profile?.id) return null;

    const { data: authUser, error: authError } = await adminSupabase.auth.admin.getUserById(profile.id);
    if (authError) return null;
    return authUser.user?.email ?? null;
  });

  if (!result.ok) {
    return jsonError(result.message, 404);
  }

  const { data, error } = await authSupabase.auth.signInWithPassword({
    email: result.email,
    password,
  });
  if (error || !data.session) {
    return jsonError("密码不对，或这个账号不是用当前邮箱/手机号注册的。", 401);
  }

  return NextResponse.json({ session: data.session });
}
