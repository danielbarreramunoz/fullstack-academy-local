import { Module } from "@nestjs/common";
import { LessonsController } from "./lessons.controller";
import { CapabilitiesGuard } from "../../common/guards/capabilities.guard";

@Module({ controllers: [LessonsController], providers: [CapabilitiesGuard] })
export class LessonsModule {}
