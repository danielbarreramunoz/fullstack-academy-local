import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { CAPABILITY_KEY } from "../decorators/capability.decorator";
import { audit } from "../../db";

// P4 funnel: autorización global por capability. 403 + auditoría.
@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(CAPABILITY_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required) return true;
    const req = ctx.switchToHttp().getRequest();
    const caps: string[] = req.user?.capabilities ?? [];
    if (!caps.includes(required)) {
      await audit(req.user?.id ?? null, "capability.denied", "capability", required, 403, {
        path: req.url,
      }).catch(() => undefined);
      throw new ForbiddenException(`missing capability ${required}`);
    }
    return true;
  }
}
