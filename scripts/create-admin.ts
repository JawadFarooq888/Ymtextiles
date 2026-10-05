/**
 * Create or update an admin/staff login.
 *
 *   npx tsx scripts/create-admin.ts owner@example.com "a-strong-password" [ADMIN|STAFF]
 *   npx tsx scripts/create-admin.ts --delete someone@example.com
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const [first, second, third] = process.argv.slice(2);

  if (first === "--delete") {
    if (!second) throw new Error("Usage: --delete <email>");
    await db.user.deleteMany({ where: { email: second.trim().toLowerCase() } });
    console.log(`Deleted ${second}`);
    return;
  }

  const email = first?.trim().toLowerCase();
  const password = second;
  const role = (third?.toUpperCase() ?? "ADMIN") as Role;
  if (!email || !password) {
    throw new Error('Usage: npx tsx scripts/create-admin.ts <email> "<password>" [ADMIN|STAFF]');
  }
  if (password.length < 10) throw new Error("Password must be at least 10 characters");
  if (role !== Role.ADMIN && role !== Role.STAFF) throw new Error("Role must be ADMIN or STAFF");

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.upsert({
    where: { email },
    update: { passwordHash, role },
    create: { email, passwordHash, role, name: role === Role.ADMIN ? "Admin" : "Staff" },
  });
  console.log(`${role} login ready for ${email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
