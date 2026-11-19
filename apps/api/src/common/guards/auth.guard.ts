import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { db } from "../../db";

// P2 funnel: 401 firma/expiración/cuenta activa. Hidrata id+role+capabilities.
@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.access_token;
    if (!token) throw new UnauthorizedException("missing token");
    try {
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { sub: string };
      const { rows } = await db().query(
        `SELECT u.id, u.email, u.role, u.is_active,
                COALESCE(array_agg(uc.capability) FILTER (WHERE uc.capability IS NOT NULL), '{}') AS capabilities
         FROM users u LEFT JOIN user_capabilities uc ON uc.user_id = u.id
         WHERE u.id = $1 GROUP BY u.id`,
        [payload.sub],
      );
      const user = rows[0];
      if (!user || !user.is_active) throw new UnauthorizedException("inactive");
      req.user = { id: user.id, email: user.email, role: user.role, capabilities: user.capabilities };
      return true;
    } catch {
      throw new UnauthorizedException("invalid token");
    }
  }
}
