# fullstack-academy-local

Plataforma de estudio local: tracks, lecciones, progreso de usuario, capabilities y audit logs.

## Tecnologías

| Capa | Herramientas |
|---|---|
| Monorepo | pnpm workspaces (12.x), TypeScript 5.5 en estricto |
| API (`apps/api`) | NestJS 10, `pg` (PostgreSQL 16), JWT (`jsonwebtoken`: access 15m + refresh 7d), `bcryptjs`, Zod, `cookie-parser` |
| Web (`apps/web`) | Next.js 14, React 18, CSS propio (sin framework UI) |
| Compartido (`packages/shared`) | Tipos + esquemas Zod (fuente de verdad de capabilities y DTOs) |
| Datos | SQL numeradas en `apps/api/src/database/migrations/*.sql` + scripts de seed (`seed`, `seed:curriculum`, `seed:all`); Redis 7 levantado en compose (disponible, sin uso en código aún) |
| Tests | `node:test` + `node:assert/strict` (cero dependencias): specs en `packages/shared` (schemas, matriz de roles) y `apps/api` (`CapabilitiesGuard`) |
| CI | GitHub Actions (`.github/workflows/ci.yml`): install → build → typecheck → test |

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
| `pnpm build` | compila shared / api / web (requerido antes de `typecheck` en limpio) |
| `pnpm typecheck` | `tsc` en shared / api / web |
| `pnpm test` | unitarios con `node:test` (shared 8 + api 3; web aún sin tests) |
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
