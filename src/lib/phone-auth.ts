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
