import { Module } from "@nestjs/common";
import { ProgressController } from "./progress.controller";
import { CapabilitiesGuard } from "../../common/guards/capabilities.guard";

@Module({ controllers: [ProgressController], providers: [CapabilitiesGuard] })
export class ProgressModule {}
