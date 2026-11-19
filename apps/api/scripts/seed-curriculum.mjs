import dotenv from "dotenv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(here, "../../../.env") });
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL missing");

const data = JSON.parse(readFileSync(join(here, "../../../content/curriculum/curriculum.json"), "utf8"));
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// Tracks idempotentes por slug
for (const t of data.tracks) {
  await db.query(
    `INSERT INTO tracks (slug, title, order_index, description) VALUES ($1,$2,$3,$4)
     ON CONFLICT (slug) DO UPDATE SET title=EXCLUDED.title, order_index=EXCLUDED.order_index, description=EXCLUDED.description`,
    [t.slug, t.title, t.order_index, t.description],
  );
}
// Limpieza demo antigua: slug 'db' reemplazado por 'databases'
await db.query(`DELETE FROM tracks WHERE slug = 'db' AND NOT EXISTS (SELECT 1 FROM lessons WHERE track_id = tracks.id)`).catch(() => undefined);

const { rows: trackRows } = await db.query(`SELECT id, slug FROM tracks`);
const bySlug = new Map(trackRows.map((r) => [r.slug, r.id]));

// Lessons idempotentes por (track_id, order_index)
for (const l of data.lessons) {
  const trackId = bySlug.get(l.track_slug);
  if (!trackId) throw new Error(`track desconocido: ${l.track_slug}`);
  await db.query(
    `INSERT INTO lessons (track_id, order_index, title, summary, theory_md, lab_prompt, checklist_json, estimated_minutes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (track_id, order_index) DO UPDATE SET
       title=EXCLUDED.title, summary=EXCLUDED.summary, theory_md=EXCLUDED.theory_md,
       lab_prompt=EXCLUDED.lab_prompt, checklist_json=EXCLUDED.checklist_json, estimated_minutes=EXCLUDED.estimated_minutes`,
    [trackId, l.order_index, l.title, l.summary, l.theory_md, l.lab_prompt, JSON.stringify(l.checklist_json), l.estimated_minutes],
  );
}

const { rows: counts } = await db.query(`SELECT (SELECT count(*) FROM tracks) AS tracks, (SELECT count(*) FROM lessons) AS lessons`);
console.log(`curriculum ok: ${counts[0].tracks} tracks, ${counts[0].lessons} lessons`);
await db.end();
