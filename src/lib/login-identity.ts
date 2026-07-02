import { normalizeEmail } from "./password-reset.ts";
import { buildPhoneAuthIdentity } from "./phone-auth.ts";

export type LoginEmailResult =
  | { ok: true; email: string }
  | { ok: false; message: string };

export function isEmailLoginIdentifier(input: string) {
  return input.includes("@");
}

export function normalizeLoginIdentifier(input: string) {
  return input.trim();
}

export async function resolveLoginEmail(
  identifier: string,
  findEmailByPhone: (storedPhone: string) => Promise<string | null>,
): Promise<LoginEmailResult> {
  const value = normalizeLoginIdentifier(identifier);
  if (!value) {
    return { ok: false, message: "请填写手机号或邮箱。" };
  }

  if (isEmailLoginIdentifier(value)) {
    return { ok: true, email: normalizeEmail(value) };
  }

  const { storedPhone } = buildPhoneAuthIdentity(value);
  const email = await findEmailByPhone(storedPhone);
  if (!email) {
    return {
      ok: false,
      message: "没有找到这个手机号绑定的账号，请确认手机号或改用注册邮箱登录。",
    };
  }
  return { ok: true, email: normalizeEmail(email) };
}
