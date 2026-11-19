import { Module } from "@nestjs/common";
import { TracksController } from "./tracks.controller";
import { CapabilitiesGuard } from "../../common/guards/capabilities.guard";

@Module({ controllers: [TracksController], providers: [CapabilitiesGuard] })
export class TracksModule {}
