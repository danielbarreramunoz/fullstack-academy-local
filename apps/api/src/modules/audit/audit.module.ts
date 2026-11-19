import { Module } from "@nestjs/common";
import { AuditController } from "./audit.controller";
import { CapabilitiesGuard } from "../../common/guards/capabilities.guard";

@Module({ controllers: [AuditController], providers: [CapabilitiesGuard] })
export class AuditModule {}
