import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { ADMIN_ROLES } from "@/lib/auth.config";

/** Returns the staff/admin user when the email and password match, otherwise null. */
export async function verifyAdminCredentials(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Compare against a dummy hash when the user is missing so timing does not reveal valid emails.
  const hash = user?.passwordHash ?? "$2b$12$xBCjYCBaMPQ06JaBzxJpK.PJkKB29m0x/vDl5Okc6ztUaNtPB/ACC";
  const valid = await bcrypt.compare(password, hash);
  if (!user || !valid || !ADMIN_ROLES.includes(user.role)) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
