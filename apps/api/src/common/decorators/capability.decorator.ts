import { SetMetadata } from "@nestjs/common";
import type { Capability } from "@academy/shared";

export const CAPABILITY_KEY = "capability";
export const RequireCapability = (cap: Capability) => SetMetadata(CAPABILITY_KEY, cap);
