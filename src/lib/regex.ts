/**
 * Phone validation.
 * Accepts Indonesian numbers: 08xxxxxxxx (8-13 digits total) or
 * international +628xxxxxxxx. We normalize to digits and require
 * 8–13 digits and optional leading "08" or "62".
 */
export const PHONE_REGEX = new RegExp(
  /^(\+?62|0)8[0-9]{6,11}$/,
);

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("62") && digits.length > 11) {
    return "0" + digits.slice(2);
  }
  if (digits.startsWith("62") && digits.length >= 8) {
    return "0" + digits.slice(2);
  }
  return digits;
}

export function isValidPhone(raw: string): boolean {
  const normalized = normalizePhone(raw);
  return PHONE_REGEX.test(normalized) && normalized.length >= 8 && normalized.length <= 13;
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(raw: string): boolean {
  return EMAIL_REGEX.test(raw);
}
