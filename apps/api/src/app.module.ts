import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module";
import { TracksModule } from "./modules/tracks/tracks.module";
import { LessonsModule } from "./modules/lessons/lessons.module";
import { ProgressModule } from "./modules/progress/progress.module";
import { AuditModule } from "./modules/audit/audit.module";
import { SandboxModule } from "./modules/sandbox/sandbox.module";

@Module({
  imports: [AuthModule, TracksModule, LessonsModule, ProgressModule, AuditModule, SandboxModule],
})
export class AppModule {}
