/** Accepts 9876543210, 09876543210, +919876543210 and returns the 10 digits, or null. */
export function normalizeMobile(value: string): string | null {
  const digits = value.replace(/[\s-]/g, "").replace(/^\+?91/, "").replace(/^0/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export const maskMobile = (mobile: string) => {
  const digits = mobile.replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 2)}••••••${digits.slice(-2)}` : mobile;
};
