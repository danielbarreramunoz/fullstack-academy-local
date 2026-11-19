import { Pool } from "pg";

let pool: Pool | null = null;

export function db(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return pool;
}

export async function audit(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  statusCode: number,
  metadata: unknown = {},
) {
  await db().query(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, status_code, metadata_json)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [userId, action, resourceType, resourceId, statusCode, JSON.stringify(metadata)],
  );
}
