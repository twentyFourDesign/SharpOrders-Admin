import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_JWT_SECRET;

if (!JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.warn("[auth] Missing AUTH_JWT_SECRET in environment");
}

export type AuthTokenPayload = {
  sub: string;
  email: string;
  role: "shipper" | "driver";
};

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET ?? "dev-secret", {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET ?? "dev-secret") as AuthTokenPayload;
  } catch {
    return null;
  }
}

