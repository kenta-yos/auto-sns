import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users } from "../src/lib/db/schema";
import { hash } from "bcryptjs";

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(url);
  const db = drizzle(sql);

  const email = process.argv[2] || "admin@example.com";
  const password = process.argv[3] || "admin123";

  const passwordHash = await hash(password, 12);

  await db.insert(users).values({ email, passwordHash }).onConflictDoNothing();

  console.log(`User seeded: ${email}`);
}

seed().catch(console.error);
