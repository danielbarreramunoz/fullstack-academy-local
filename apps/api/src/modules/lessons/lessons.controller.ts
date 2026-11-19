import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { db } from "../../db";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CapabilitiesGuard } from "../../common/guards/capabilities.guard";
import { RequireCapability } from "../../common/decorators/capability.decorator";

@UseGuards(AuthGuard, CapabilitiesGuard)
@Controller("lessons")
export class LessonsController {
  @RequireCapability("lessons:read")
  @Get(":id")
  async detail(@Param("id", new ParseUUIDPipe()) id: string) {
    // P7: parametrizada. P5: lección es global legible, el alcance se aplica en progress.
    const { rows } = await db().query(`SELECT * FROM lessons WHERE id = $1`, [id]);
    return rows[0] ?? null;
  }

  @RequireCapability("lessons:read")
  @Get("by-track/:trackId")
  async byTrack(@Param("trackId", new ParseUUIDPipe()) trackId: string) {
    const { rows } = await db().query(
      `SELECT l.*, p.status AS my_status
       FROM lessons l LEFT JOIN user_progress p ON p.lesson_id = l.id AND p.user_id = current_setting('app.user_id', true)::uuid
       WHERE l.track_id = $1 ORDER BY l.order_index`,
      [trackId],
    );
    return rows;
  }
}
