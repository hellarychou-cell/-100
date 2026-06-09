import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { canResetPassword, normalizeEmail } from "@/lib/password-reset";
import { buildPhoneAuthIdentity } from "@/lib/phone-auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: Request) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const { email, phone, password } = await req.json();
  const normalizedEmail = normalizeEmail(String(email ?? ""));
  const normalizedPhone = String(phone ?? "").trim();
  const newPassword = String(password ?? "");

  if (!normalizedEmail || !normalizedPhone || !newPassword) {
    return NextResponse.json({ error: "请填写邮箱、手机号和新密码。" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "新密码至少需要6位。" }, { status: 400 });
  }

  const { storedPhone } = buildPhoneAuthIdentity(normalizedPhone);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, phone, email")
    .eq("phone", storedPhone)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "邮箱或手机号不匹配，请检查后再试。" }, { status: 404 });
  }

  if (!canResetPassword({
    inputEmail: normalizedEmail,
    inputPhone: storedPhone,
    storedEmail: profile.email,
    storedPhone: profile.phone,
  })) {
    return NextResponse.json({ error: "邮箱或手机号不匹配，请检查后再试。" }, { status: 403 });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
