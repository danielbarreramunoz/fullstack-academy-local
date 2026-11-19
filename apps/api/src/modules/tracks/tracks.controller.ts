import { Controller, Get, UseGuards } from "@nestjs/common";
import { db } from "../../db";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CapabilitiesGuard } from "../../common/guards/capabilities.guard";
import { RequireCapability } from "../../common/decorators/capability.decorator";

@UseGuards(AuthGuard, CapabilitiesGuard)
@Controller("tracks")
export class TracksController {
  @RequireCapability("lessons:read")
  @Get()
  async list() {
    const { rows } = await db().query(
      `SELECT t.*, COUNT(l.id)::int AS lessons_count
       FROM tracks t LEFT JOIN lessons l ON l.track_id = t.id
       GROUP BY t.id ORDER BY t.order_index`,
    );
    return rows;
  }
}
