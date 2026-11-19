# fullstack-academy-local — AGENTS.md (proyecto)

Stack: pnpm monorepo + NestJS (API) + Next.js (web) + PostgreSQL 16 + Redis 7 + SQL migraciones.

## Reglas del proyecto
1. Dominio estudio (tracks, lessons, user_progress, capabilities, audit_logs) vive aquí, nunca en `.harness/`.
2. Backend: validar `docs/backend-funnel.md` del arnés (P1-P8) en todo endpoint/servicio/repo/DTO/migración.
3. Auth: JWT access (15m) + refresh (7d) en cookie HttpOnly `Secure; SameSite=Lax`. Access en memoria, nunca `localStorage`.
4. Validación: Zod o `class-validator` con `forbidNonWhitelisted`. Bloquear mass assignment (`userId`, `completedByAdmin`, `role`).
5. Alcance anti-IDOR: toda escritura a `user_progress` filtra `WHERE id=$1 AND user_id=$2`. Sin scope → 403/404 + fila en `audit_logs`.
6. Salida: DTO sin `password_hash`. Códigos: 200/201/204/400/401/403/404/409/500.
7. DB: SQL en `apps/api/src/database/migrations/*.sql`, numeradas, idempotentes en lo posible. Constraints + índices explícitos.
8. Commits pequeños, sin `git push` sin permiso.

## Comandos
- `docker compose up -d` → postgres:5432 + redis:6379
- `pnpm install` → instala workspaces
- `pnpm --filter @academy/api migration:run` → migraciones SQL
- `pnpm --filter @academy/api seed` → usuarios demo + tracks/lessons demo
- `pnpm typecheck` → tsc en shared/api/web
