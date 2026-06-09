export function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

export function canResetPassword({
  inputEmail,
  inputPhone,
  storedEmail,
  storedPhone,
}: {
  inputEmail: string;
  inputPhone: string;
  storedEmail: string | null | undefined;
  storedPhone: string | null | undefined;
}) {
  const normalizedInputEmail = normalizeEmail(inputEmail);
  const normalizedStoredEmail = normalizeEmail(storedEmail ?? "");
  const normalizedInputPhone = inputPhone.replace(/\D/g, "").replace(/^86(?=1\d{10}$)/, "");
  const normalizedStoredPhone = (storedPhone ?? "").replace(/\D/g, "").replace(/^86(?=1\d{10}$)/, "");

  return Boolean(
    normalizedInputEmail &&
      normalizedStoredEmail &&
      normalizedInputPhone &&
      normalizedStoredPhone &&
      normalizedInputEmail === normalizedStoredEmail &&
      normalizedInputPhone === normalizedStoredPhone,
  );
}
