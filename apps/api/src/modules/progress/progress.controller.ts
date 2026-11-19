import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards, NotFoundException, ForbiddenException } from "@nestjs/common";
import { z } from "zod";
import { updateProgressSchema } from "@academy/shared";
import { db, audit } from "../../db";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CapabilitiesGuard } from "../../common/guards/capabilities.guard";
import { RequireCapability } from "../../common/decorators/capability.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/decorators/current-user.decorator";
import { ZodPipe } from "../../common/pipes/zod.pipe";

const startSchema = z.object({ lesson_id: z.string().uuid() }).strict();

@UseGuards(AuthGuard, CapabilitiesGuard)
@Controller("progress")
export class ProgressController {
  @RequireCapability("progress:read")
  @Get()
  async mine(@CurrentUser() user: RequestUser) {
    // P5+P7: solo filas propias, query parametrizada.
    const { rows } = await db().query(
      `SELECT p.*, l.title AS lesson_title, l.track_id
       FROM user_progress p JOIN lessons l ON l.id = p.lesson_id
       WHERE p.user_id = $1 ORDER BY p.updated_at DESC`,
      [user.id],
    );
    return rows;
  }

  @RequireCapability("progress:write")
  @Post("start")
  async start(@CurrentUser() user: RequestUser, @Body(new ZodPipe(startSchema)) body: { lesson_id: string }) {
    // P6: upsert idempotente (transición legal). P7: transacción.
    const client = await db().connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO user_progress (user_id, lesson_id, status) VALUES ($1,$2,'in_progress')
         ON CONFLICT (user_id, lesson_id) DO UPDATE SET status = CASE WHEN user_progress.status='pending' THEN 'in_progress' ELSE user_progress.status END, updated_at = now()`,
        [user.id, body.lesson_id],
      );
      const { rows } = await client.query(
        `SELECT * FROM user_progress WHERE user_id = $1 AND lesson_id = $2`,
        [user.id, body.lesson_id],
      );
      await client.query("COMMIT");
      await audit(user.id, "progress.start", "user_progress", rows[0].id, 200, { lesson_id: body.lesson_id }).catch(() => undefined);
      return rows[0];
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  @RequireCapability("progress:write")
  @Patch(":id")
  async update(
    @CurrentUser() user: RequestUser,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodPipe(updateProgressSchema)) body: { status?: "pending" | "in_progress" | "completed"; notes_md?: string },
  ) {
    // P5 ANTI-IDOR: el id debe pertenecer al solicitante. Reforzado en la query de escritura.
    const { rows: existing } = await db().query(`SELECT id FROM user_progress WHERE id = $1 AND user_id = $2`, [id, user.id]);
    if (existing.length === 0) {
      await audit(user.id, "progress.update.denied", "user_progress", id, 404, { reason: "not-owned-or-missing" }).catch(() => undefined);
      throw new NotFoundException("progress not found");
    }
    const completed_at = body.status === "completed" ? new Date() : null;
    const next_review_at = body.status === "completed" ? new Date(Date.now() + 3 * 86400 * 1000) : null;
    const { rows } = await db().query(
      `UPDATE user_progress SET
         status = COALESCE($3, status),
         notes_md = COALESCE($4, notes_md),
         completed_at = COALESCE($5, completed_at),
         next_review_at = COALESCE($6, next_review_at),
         updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, user.id, body.status ?? null, body.notes_md ?? null, completed_at, next_review_at],
    );
    if (rows.length === 0) throw new ForbiddenException("scope denied");
    await audit(user.id, "progress.update", "user_progress", id, 200, { status: body.status }).catch(() => undefined);
    return rows[0];
  }
}
