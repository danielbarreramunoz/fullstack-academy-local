import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import pg from "pg";
import { ROLE_CAPABILITIES } from "@academy/shared";

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), "../../../.env") });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing (revisa .env en raíz)");

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

const users = [
  { email: "student@local.test", password: "student123", role: "student" },
  { email: "mentor@local.test", password: "mentor1234", role: "mentor" },
  { email: "admin@local.test", password: "admin12345", role: "admin" },
];
for (const u of users) {
  const hash = await bcrypt.hash(u.password, 10);
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,$3)
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role=EXCLUDED.role RETURNING id`,
    [u.email, hash, u.role],
  );
  const id = rows[0].id;
  for (const cap of ROLE_CAPABILITIES[u.role]) {
    await db.query(`INSERT INTO user_capabilities (user_id, capability) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [id, cap]);
  }
}

await db.end();
console.log("seed usuarios ok: student@local.test / mentor@local.test / admin@local.test");
