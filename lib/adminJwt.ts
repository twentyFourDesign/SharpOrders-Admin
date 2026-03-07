import jwt from "jsonwebtoken";

const SECRET = process.env.ADMIN_JWT_SECRET ?? process.env.AUTH_JWT_SECRET ?? "admin-dev-secret";

export type AdminTokenPayload = {
  sub: string;   // admin.id
  email: string;
  role: "admin";
};

export function signAdminToken(payload: Omit<AdminTokenPayload, "role">): string {
  return jwt.sign({ ...payload, role: "admin" }, SECRET, { expiresIn: "8h" });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    const p = jwt.verify(token, SECRET) as AdminTokenPayload;
    if (p.role !== "admin") return null;
    return p;
  } catch {
    return null;
  }
}
