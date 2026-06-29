import { createHmac, randomBytes } from "crypto";

const SECRET = process.env.BETTER_AUTH_SECRET ?? "fallback-dev-secret-change-me";

export interface JwtPayload {
  userId: string;
  workspaceId?: string;
  iat?: number;
  exp?: number;
}

function base64url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function signToken(payload: JwtPayload, expiresInSeconds = 86400): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(
    JSON.stringify({ ...payload, iat: now, exp: now + expiresInSeconds })
  );
  const signature = createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): JwtPayload {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) throw new Error("Invalid token format");

  const expected = createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");

  if (expected !== signature) throw new Error("Invalid token signature");

  const payload = JSON.parse(
    Buffer.from(body, "base64url").toString("utf-8")
  ) as JwtPayload;

  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Token expired");
  }

  return payload;
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}
