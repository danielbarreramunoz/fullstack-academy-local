import { Body, Controller, Get, Post, Res, UseGuards, UnauthorizedException } from "@nestjs/common";
import type { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { loginSchema } from "@academy/shared";
import { db, audit } from "../../db";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { RequestUser } from "../../common/decorators/current-user.decorator";
import { ZodPipe } from "../../common/pipes/zod.pipe";

function signAccess(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m" });
}
function signRefresh(userId: string) {
  return jwt.sign({ sub: userId, typ: "refresh" }, process.env.JWT_REFRESH_SECRET!, { expiresIn: "7d" });
}

@Controller("auth")
export class AuthController {
  @Post("login")
  async login(@Body(new ZodPipe(loginSchema)) body: { email: string; password: string }, @Res({ passthrough: true }) res: Response) {
    const { rows } = await db().query(`SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1`, [body.email]);
    const user = rows[0];
    if (!user || !user.is_active) {
      await audit(null, "auth.login.denied", "user", body.email, 401, {}).catch(() => undefined);
      throw new UnauthorizedException("invalid credentials");
    }
    const ok = await bcrypt.compare(body.password, user.password_hash);
    if (!ok) {
      await audit(user.id, "auth.login.denied", "user", user.id, 401, {}).catch(() => undefined);
      throw new UnauthorizedException("invalid credentials");
    }
    const access = signAccess(user.id);
    const refresh = signRefresh(user.id);
    res.cookie("refresh_token", refresh, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 7 * 86400 * 1000, path: "/" });
    res.cookie("access_token", access, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 15 * 60 * 1000, path: "/" });
    await audit(user.id, "auth.login", "user", user.id, 200, {}).catch(() => undefined);
    return { access_token: access, user: { id: user.id, email: user.email, role: user.role } };
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("refresh_token", { path: "/" });
    res.clearCookie("access_token", { path: "/" });
    return { ok: true };
  }

  @UseGuards(AuthGuard)
  @Get("me")
  async me(@CurrentUser() user: RequestUser) {
    return { user };
  }
}
