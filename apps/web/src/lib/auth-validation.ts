/**
 * Shared client/server validation for the email + password ("custom") login
 * path. Social login (Google/GitHub) is the primary path and needs none of
 * this — these rules only apply when a user chooses to use a raw credential.
 *
 * Keep the password floor in sync with `emailAndPassword.minPasswordLength`
 * in apps/web/src/server/auth/auth.ts.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 80;

// Pragmatic email shape check. Real deliverability is verified out of band;
// this just rejects obviously malformed input before hitting the server.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return "Email is required.";
  if (value.length > 254) return "Email is too long.";
  if (!EMAIL_REGEX.test(value)) return "Enter a valid email address.";
  return null;
}

export function validateName(name: string): string | null {
  const value = name.trim();
  if (!value) return "Name is required.";
  if (value.length < NAME_MIN_LENGTH)
    return `Name must be at least ${NAME_MIN_LENGTH} characters.`;
  if (value.length > NAME_MAX_LENGTH)
    return `Name must be at most ${NAME_MAX_LENGTH} characters.`;
  return null;
}

export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (p) => /[a-z]/.test(p),
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (p) => /[A-Z]/.test(p),
  },
  { id: "number", label: "One number", test: (p) => /[0-9]/.test(p) },
  {
    id: "special",
    label: "One special character (!@#$…)",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export type PasswordStrength = {
  /** Number of satisfied rules (0..PASSWORD_RULES.length). */
  score: number;
  /** Per-rule pass/fail, for rendering a live checklist. */
  results: { id: string; label: string; passed: boolean }[];
  /** Coarse label derived from score. */
  level: "empty" | "weak" | "fair" | "good" | "strong";
};

export function getPasswordStrength(password: string): PasswordStrength {
  const results = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(password),
  }));
  const score = results.filter((r) => r.passed).length;

  let level: PasswordStrength["level"] = "empty";
  if (password.length === 0) level = "empty";
  else if (score <= 2) level = "weak";
  else if (score === 3) level = "fair";
  else if (score === 4) level = "good";
  else level = "strong";

  return { score, results, level };
}

/** Returns the first failing reason, or null if the password is acceptable. */
export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length > PASSWORD_MAX_LENGTH)
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  const failing = PASSWORD_RULES.find((rule) => !rule.test(password));
  return failing ? failing.label : null;
}
