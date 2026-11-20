# fullstack-academy-local

Plataforma de estudio local: tracks, lecciones, progreso de usuario, capabilities y audit logs.

Stack: **pnpm monorepo + NestJS (API) + Next.js (web) + PostgreSQL 16 + Redis 7 + migraciones SQL**.

## Requisitos

- Node 20+
- pnpm 12 (`corepack enable pnpm`)
- Docker Compose (PostgreSQL + Redis)

## Arranque rápido

```bash
cp .env.example .env        # ajustar secretos JWT (mín. 32 chars)
docker compose up -d        # postgres:5432 + redis:6379
pnpm install
pnpm --filter @academy/api migration:run
pnpm --filter @academy/api seed:all   # usuarios demo + 5 tracks x 5 lecciones
pnpm dev                    # API :3001 + web :3000
```

## Comandos

| Comando | Qué hace |
|---|---|
| `pnpm dev` | levanta DB + API + web en paralelo |
| `pnpm typecheck` | `tsc` en shared / api / web |
| `pnpm --filter @academy/api migration:run` | corre migraciones SQL |
| `pnpm --filter @academy/api seed` | usuarios demo + capabilities |
| `pnpm --filter @academy/api seed:curriculum` | 5 tracks + 25 lecciones (idempotente) |
| `pnpm --filter @academy/api seed:all` | usuarios + currículo |

## Estructura

```text
apps/api/     # NestJS — endpoints, guards anti-IDOR, servicios, repos, DTOs
apps/api/src/database/migrations/*.sql  # SQL numeradas, idempotentes en lo posible
apps/web/     # Next.js — login, tracks, lecciones, sandbox
packages/shared/  # tipos y esquemas compartidos (Zod)
content/curriculum/  # fuente del currículo para el seed
```

## Seguridad (reglas del proyecto)

- Auth: JWT access (15m) + refresh (7d) en cookie HttpOnly `Secure; SameSite=Lax`. Access en memoria, nunca `localStorage`.
- Validación con Zod / `class-validator` + `forbidNonWhitelisted`. Sin mass assignment (`userId`, `role`, …).
- Anti-IDOR: toda escritura a `user_progress` filtra `WHERE id=$1 AND user_id=$2`. Sin scope → 403/404 + fila en `audit_logs`.
- Salida: DTO sin `password_hash`. Códigos: 200/201/204/400/401/403/404/409/500.

Ver `AGENTS.md` para las reglas completas del proyecto.
