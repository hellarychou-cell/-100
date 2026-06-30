import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/password-reset";
import { buildPhoneAuthIdentity } from "@/lib/phone-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonError("服务器注册服务还没有配置好。", 500);
  }

  const body = await req.json().catch(() => null);
  const displayName = String(body?.displayName ?? "").trim() || "她";
  const email = normalizeEmail(String(body?.email ?? ""));
  const phone = String(body?.phone ?? "").trim();
  const password = String(body?.password ?? "");

  if (!email || !phone || !password) {
    return jsonError("请填写邮箱、手机号和密码。");
  }
  if (password.length < 6) {
    return jsonError("密码至少需要6位。");
  }

  const { storedPhone } = buildPhoneAuthIdentity(phone);
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingPhone, error: phoneError } = await supabase
    .from("profiles")
    .select("id")
    .eq("phone", storedPhone)
    .maybeSingle();

  if (phoneError) {
    return jsonError(`检查手机号失败：${phoneError.message}`, 500);
  }
  if (existingPhone) {
    return jsonError("这个手机号已经注册过了，请直接登录。", 409);
  }

  const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listError) {
    return jsonError(`检查邮箱失败：${listError.message}`, 500);
  }

  const emailExists = authUsers.users.some((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return jsonError("这个邮箱已经注册过了，请直接登录。", 409);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      phone: storedPhone,
    },
  });

  if (error || !data.user) {
    const raw = error?.message ?? "注册失败。";
    const message = raw.includes("Database error saving new user")
      ? "注册资料保存失败。请确认手机号没有重复，或稍后再试。"
      : raw;
    return jsonError(message, raw.includes("already") ? 409 : 500);
  }

  const [{ error: profileError }, progressResult] = await Promise.all([
    supabase.from("profiles").upsert({
      id: data.user.id,
      phone: storedPhone,
      display_name: displayName,
    }),
    supabase.from("progress").upsert({
      user_id: data.user.id,
      current_day: 1,
      next_unlock_date: null,
    }),
  ]);
  const progressError = progressResult.error
    ? (await supabase.from("progress").upsert({
        user_id: data.user.id,
        current_day: 1,
      })).error
    : null;

  if (profileError || progressError) {
    return jsonError(`账号已创建，但资料初始化失败：${profileError?.message ?? progressError?.message}`, 500);
  }

  return NextResponse.json({ ok: true, userId: data.user.id });
}
