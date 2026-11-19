import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { db, audit } from "../../db";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/decorators/current-user.decorator";

// Laboratorio: demuestra el bloqueo anti-IDOR sin exponer datos ajenos.
@UseGuards(AuthGuard)
@Controller("sandbox")
export class SandboxController {
  @Get("idor-demo")
  async idorDemo(@CurrentUser() user: RequestUser, @Query("progressId") progressId: string) {
    const { rows } = await db().query(`SELECT id FROM user_progress WHERE id = $1 AND user_id = $2`, [
      progressId,
      user.id,
    ]);
    if (rows.length === 0) {
      await audit(user.id, "sandbox.idor.blocked", "user_progress", progressId, 403, {}).catch(() => undefined);
      return { allowed: false, reason: "BLOCKED: ese progressId no es tuyo (403/404 + audit_logs)" };
    }
    return { allowed: true, reason: "OK: recurso propio" };
  }
}
