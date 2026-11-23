// npm run set-password
//
// Makes (or replaces) the one login for this app. Run it once after
// `npm run db:push`, and again any time you want a new email or password.
// There is no sign-up page; this is the only way in.

import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcryptjs from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const rl = createInterface({ input: stdin, output: stdout });
  const email = (await rl.question("Email: ")).trim().toLowerCase();
  const name = (await rl.question("Your first name: ")).trim();
  const password = await rl.question("Password (12+ characters): ");
  const again = await rl.question("Password again: ");
  rl.close();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error("That email doesn't look right.");
  }
  if (password.length < 12) {
    throw new Error("Use at least 12 characters.");
  }
  if (password !== again) {
    throw new Error("The passwords don't match.");
  }

  const passwordHash = await bcryptjs.hash(password, 12);

  // Exactly one login: replace whatever was there.
  await db.$transaction([
    db.owner.deleteMany({ where: { NOT: { email } } }),
    db.owner.upsert({
      where: { email },
      create: { email, name, passwordHash },
      update: { name, passwordHash, failedAttempts: 0, lockedUntil: null },
    }),
  ]);

  console.log(`\nDone. Log in as ${email}.`);
}

main()
  .catch((e) => {
    console.error(`\n${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
