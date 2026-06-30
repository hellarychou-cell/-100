export function buildPhoneAuthIdentity(input: string) {
  const digits = input.replace(/\D/g, "");
  if (!digits) throw new Error("请填写手机号。");

  const canonicalPhone = digits.length === 11 && digits.startsWith("1") ? `86${digits}` : digits;
  const storedPhone = canonicalPhone.length === 13 && canonicalPhone.startsWith("86") ? canonicalPhone.slice(2) : digits;

  return {
    authEmail: `phone-${canonicalPhone}@example.com`,
    storedPhone,
  };
}

export type LocalIdentityRecord = {
  phone: string;
  email?: string;
};

export function normalizeIdentityEmail(input: string) {
  return input.trim().toLowerCase();
}

export function normalizeStoredPhone(input: string) {
  return buildPhoneAuthIdentity(input).storedPhone;
}

export function validateLocalRegistrationIdentity(
  existing: LocalIdentityRecord | null,
  next: { phone: string; email: string },
) {
  if (!existing) return { ok: true as const };

  const nextPhone = normalizeStoredPhone(next.phone);
  const existingPhone = normalizeStoredPhone(existing.phone);
  if (existingPhone === nextPhone) {
    return { ok: false as const, message: "这个手机号已经注册过了，请直接登录。" };
  }

  const nextEmail = normalizeIdentityEmail(next.email);
  const existingEmail = normalizeIdentityEmail(existing.email ?? "");
  if (existingEmail && existingEmail === nextEmail) {
    return { ok: false as const, message: "这个邮箱已经注册过了，请直接登录。" };
  }

  return { ok: true as const };
}
