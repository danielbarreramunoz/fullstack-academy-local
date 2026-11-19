import { Controller, Get, UseGuards } from "@nestjs/common";
import { db } from "../../db";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CapabilitiesGuard } from "../../common/guards/capabilities.guard";
import { RequireCapability } from "../../common/decorators/capability.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/decorators/current-user.decorator";

@UseGuards(AuthGuard, CapabilitiesGuard)
@Controller("audit-logs")
export class AuditController {
  @RequireCapability("audit:read")
  @Get("mine")
  async mine(@CurrentUser() user: RequestUser) {
    const { rows } = await db().query(
      `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [user.id],
    );
    return rows;
  }
}
