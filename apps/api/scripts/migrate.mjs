import dotenv from "dotenv";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(here, "../../../.env") });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing (revisa .env en raíz)");
const dir = join(here, "../src/database/migrations");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  console.log("applying", f);
  await client.query(readFileSync(join(dir, f), "utf8"));
}
await client.end();
console.log("migrations ok");
